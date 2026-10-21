import { db } from "../models/database";
import { HttpError } from "./errors";
import { assertRegistrationOpen, assertCancellationOpen } from "./matchRules";
import { newToken, tokenHash } from "./security";
import type { Prisma } from "../generated/prisma/client";

// Todas as alterações de presença/sorteio disputam o mesmo lock por partida.
export async function lockedMatch(
  tx: Prisma.TransactionClient,
  matchId: string,
) {
  await tx.$queryRaw`SELECT id FROM "FootballMatch" WHERE id = ${matchId}::uuid FOR UPDATE`;
  const match = await tx.footballMatch.findUnique({ where: { id: matchId } });
  if (!match) throw new HttpError(404, "Partida não encontrada.");
  return match;
}

export async function confirmPresence(
  matchId: string,
  identity: { userId: string } | { guestName: string },
) {
  return db.$transaction(async (tx) => {
    const match = await lockedMatch(tx, matchId);
    assertRegistrationOpen(match);
    const userId = "userId" in identity ? identity.userId : null;
    const existing = userId
      ? await tx.matchPresence.findUnique({
          where: { matchId_userId: { matchId, userId } },
        })
      : null;
    if (existing?.status === "confirmed")
      throw new HttpError(409, "Você já confirmou presença.");
    const count = await tx.matchPresence.count({
      where: { matchId, status: "confirmed" },
    });
    if (count >= match.maxPlayers)
      throw new HttpError(422, "A partida está lotada.");
    const token = userId ? null : newToken();
    const presence = existing
      ? await tx.matchPresence.update({
          where: { id: existing.id },
          data: { status: "confirmed", confirmedAt: new Date() },
        })
      : await tx.matchPresence.create({
          data: {
            matchId,
            userId,
            guestName: "guestName" in identity ? identity.guestName : null,
            cancelHash: token ? tokenHash(token) : null,
          },
        });
    await tx.matchTeam.deleteMany({ where: { matchId } });
    return { id: presence.id, cancelToken: token };
  });
}

export async function cancelPresence(
  matchId: string,
  identity: { userId: string } | { cancelToken: string },
) {
  return db.$transaction(async (tx) => {
    const match = await lockedMatch(tx, matchId);
    assertRegistrationOpen(match);
    assertCancellationOpen(match.scheduledAt);
    const presence = await tx.matchPresence.findFirst({
      where: {
        matchId,
        status: "confirmed",
        ...("userId" in identity
          ? { userId: identity.userId }
          : { cancelHash: tokenHash(identity.cancelToken) }),
      },
    });
    if (!presence) throw new HttpError(404, "Presença não encontrada.");
    await tx.matchPresence.update({
      where: { id: presence.id },
      data: { status: "canceled" },
    });
    await tx.matchTeam.deleteMany({ where: { matchId } });
  });
}
