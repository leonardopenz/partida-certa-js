import type { Request, RequestHandler, Response } from "express";
import { z } from "zod";
import { db } from "../models/database";
import { requireMembership, playerUser } from "../models/groupModel";
import { param } from "./groupController";
import { HttpError } from "../services/errors";
import { assertRegistrationOpen, drawTeams } from "../services/matchRules";
import {
  lockedMatch,
  confirmPresence,
  cancelPresence,
} from "../services/presenceService";

const matchInput = z
  .object({
    title: z.string().trim().min(2).max(100),
    type: z.enum(["society", "futsal", "campo"]).default("society"),
    scheduledAt: z.iso
      .datetime({ offset: true })
      .transform((v) => new Date(v))
      .refine((v) => v > new Date(), "Escolha uma data futura."),
    durationMinutes: z.number().int().min(15).max(300).default(60),
    minPlayers: z.number().int().min(2).max(100).default(10),
    maxPlayers: z.number().int().min(2).max(100).default(20),
    location: z.string().trim().min(2).max(300),
    priceCents: z.number().int().min(0).max(1000000).default(0),
    notes: z.string().trim().max(1000).default(""),
  })
  .refine((v) => v.minPlayers <= v.maxPlayers, {
    message: "Mínimo deve ser menor ou igual ao máximo.",
    path: ["minPlayers"],
  });

async function authorizedMatch(req: Request, res: Response, admin = false) {
  const groupId = param(req, "groupId");
  await requireMembership(groupId, res.locals.user.id, admin);
  const match = await db.footballMatch.findFirst({
    where: { id: param(req, "matchId"), groupId },
  });
  if (!match) throw new HttpError(404, "Partida não encontrada neste grupo.");
  return match;
}

const details = {
  presences: {
    where: { status: "confirmed" as const },
    orderBy: { confirmedAt: "asc" as const },
    select: {
      id: true,
      userId: true,
      guestName: true,
      user: { select: playerUser },
    },
  },
  teams: {
    orderBy: { name: "asc" as const },
    include: {
      players: {
        include: {
          presence: {
            select: { id: true, guestName: true, user: { select: playerUser } },
          },
        },
      },
    },
  },
};

export const createMatch: RequestHandler = async (req, res) => {
  const groupId = param(req, "groupId");
  await requireMembership(groupId, res.locals.user.id, true);
  const data = matchInput.parse(req.body);
  const match = await db.footballMatch.create({ data: { ...data, groupId } });
  res.status(201).json(match);
};

export const showMatch: RequestHandler = async (req, res) => {
  const match = await authorizedMatch(req, res);
  res.json(
    await db.footballMatch.findUniqueOrThrow({
      where: { id: match.id },
      include: details,
    }),
  );
};

export const cancelMatch: RequestHandler = async (req, res) => {
  const match = await authorizedMatch(req, res, true);
  await db.$transaction(async (tx) => {
    const current = await lockedMatch(tx, match.id);
    assertRegistrationOpen(current);
    await tx.footballMatch.update({
      where: { id: match.id },
      data: { status: "canceled" },
    });
    await tx.matchTeam.deleteMany({ where: { matchId: match.id } });
  });
  res.sendStatus(204);
};

export const confirmMember: RequestHandler = async (req, res) => {
  const match = await authorizedMatch(req, res);
  res
    .status(201)
    .json(await confirmPresence(match.id, { userId: res.locals.user.id }));
};

export const cancelMember: RequestHandler = async (req, res) => {
  const match = await authorizedMatch(req, res);
  await cancelPresence(match.id, { userId: res.locals.user.id });
  res.sendStatus(204);
};

export const saveDraw: RequestHandler = async (req, res) => {
  const match = await authorizedMatch(req, res, true);
  const teams = await db.$transaction(async (tx) => {
    const current = await lockedMatch(tx, match.id);
    assertRegistrationOpen(current);
    const group = await tx.group.findUniqueOrThrow({
      where: { id: match.groupId },
    });
    const players = await tx.matchPresence.findMany({
      where: { matchId: match.id, status: "confirmed" },
      select: { id: true },
    });
    const drawn = drawTeams(players, group.teamCount);
    await tx.matchTeam.deleteMany({ where: { matchId: match.id } });
    for (const [i, team] of drawn.entries()) {
      await tx.matchTeam.create({
        data: {
          matchId: match.id,
          name: `Time ${i + 1}`,
          players: { create: team.map((p) => ({ presenceId: p.id })) },
        },
      });
    }
    return tx.matchTeam.findMany({
      where: { matchId: match.id },
      include: details.teams.include,
      orderBy: { name: "asc" },
    });
  });
  res.json(teams);
};

async function matchByToken(req: Request) {
  const match = await db.footballMatch.findUnique({
    where: { presenceToken: param(req, "token") },
  });
  if (!match) throw new HttpError(404, "Link de presença inválido.");
  return match;
}

export const showPublicMatch: RequestHandler = async (req, res) => {
  const match = await matchByToken(req);
  const data = await db.footballMatch.findUniqueOrThrow({
    where: { id: match.id },
    include: { ...details, group: { select: { name: true } } },
  });
  // Não divulgar e-mails, sessões ou tokens individuais de cancelamento.
  res.json({
    title: data.title,
    groupName: data.group.name,
    scheduledAt: data.scheduledAt,
    location: data.location,
    priceCents: data.priceCents,
    maxPlayers: data.maxPlayers,
    status: data.status,
    presences: data.presences.map((p) => ({
      id: p.id,
      name: p.user?.name ?? p.guestName,
    })),
    teams: data.teams.map((t) => ({
      name: t.name,
      players: t.players.map(
        (p) => p.presence.user?.name ?? p.presence.guestName,
      ),
    })),
  });
};

export const confirmGuest: RequestHandler = async (req, res) => {
  const { name } = z
    .object({ name: z.string().trim().min(2).max(100) })
    .parse(req.body);
  const match = await matchByToken(req);
  res.status(201).json(await confirmPresence(match.id, { guestName: name }));
};

export const cancelGuest: RequestHandler = async (req, res) => {
  const { cancelToken } = z
    .object({ cancelToken: z.string().regex(/^[a-f0-9]{64}$/) })
    .parse(req.body);
  const match = await matchByToken(req);
  await cancelPresence(match.id, { cancelToken });
  res.sendStatus(204);
};
