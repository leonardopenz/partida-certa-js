import type { RequestHandler, Request } from "express";
import { z } from "zod";
import { db } from "../models/database";
import { requireMembership, playerUser } from "../models/groupModel";
import { HttpError } from "../services/errors";

export const param = (req: Request, name: string) =>
  z.uuid().parse(req.params[name]);
const groupInput = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(1000).default(""),
  city: z.string().trim().max(100).default(""),
  teamCount: z.number().int().min(2).max(8).default(2),
});

export const listGroups: RequestHandler = async (_req, res) => {
  const groups = await db.group.findMany({
    where: { members: { some: { userId: res.locals.user.id } } },
    select: {
      id: true,
      name: true,
      city: true,
      description: true,
      teamCount: true,
      ownerId: true,
      _count: { select: { members: true, matches: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(groups);
};

export const createGroup: RequestHandler = async (req, res) => {
  const data = groupInput.parse(req.body);
  const group = await db.group.create({
    data: {
      ...data,
      ownerId: res.locals.user.id,
      members: { create: { userId: res.locals.user.id, role: "admin" } },
    },
  });
  res.status(201).json(group);
};

export const showGroup: RequestHandler = async (req, res) => {
  const id = param(req, "groupId");
  const member = await requireMembership(id, res.locals.user.id);
  const group = await db.group.findUniqueOrThrow({
    where: { id },
    include: {
      members: { include: { user: { select: playerUser } } },
      matches: {
        orderBy: { scheduledAt: "asc" },
        include: {
          _count: { select: { presences: { where: { status: "confirmed" } } } },
        },
      },
    },
  });
  res.json({
    ...group,
    inviteToken: member.role === "admin" ? group.inviteToken : undefined,
    myRole: member.role,
  });
};

export const joinGroup: RequestHandler = async (req, res) => {
  const { token } = z.object({ token: z.uuid() }).parse(req.body);
  const group = await db.group.findUnique({ where: { inviteToken: token } });
  if (!group) throw new HttpError(404, "Convite inválido.");
  await db.groupMember.upsert({
    where: {
      groupId_userId: { groupId: group.id, userId: res.locals.user.id },
    },
    create: { groupId: group.id, userId: res.locals.user.id },
    update: {},
  });
  res.json({ id: group.id });
};
