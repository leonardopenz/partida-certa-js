import { randomInt } from "node:crypto";
import { HttpError } from "./errors";

export function assertRegistrationOpen(
  match: { status: string; scheduledAt: Date },
  now = new Date(),
) {
  if (match.status !== "scheduled" || match.scheduledAt <= now) {
    throw new HttpError(422, "Esta partida não aceita alterações de presença.");
  }
}

export function assertCancellationOpen(scheduledAt: Date, now = new Date()) {
  if (now.getTime() >= scheduledAt.getTime() - 30 * 60_000) {
    throw new HttpError(
      422,
      "O prazo para cancelamento encerra 30 minutos antes da partida.",
    );
  }
}

export function drawTeams<T>(
  players: T[],
  count: number,
  pick = randomInt,
): T[][] {
  if (
    !Number.isInteger(count) ||
    count < 2 ||
    count > 8 ||
    players.length < count
  ) {
    throw new HttpError(
      422,
      "Confirme ao menos um jogador por time (2 a 8 times).",
    );
  }
  const shuffled = [...players];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = pick(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const teams: T[][] = Array.from({ length: count }, () => []);
  shuffled.forEach((player, i) => teams[i % count].push(player));
  return teams;
}
