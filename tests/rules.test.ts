import { test } from "node:test";
import assert from "node:assert/strict";
import {
  drawTeams,
  assertCancellationOpen,
  assertRegistrationOpen,
} from "../src/server/services/matchRules";
import { hashPassword, verifyPassword } from "../src/server/services/security";

test("sorteio distribui jogadores uma única vez e mantém diferença de no máximo um", () => {
  const players = Array.from({ length: 17 }, (_, id) => id);
  const original = [...players];
  const teams = drawTeams(players, 3, () => 0);
  assert.deepEqual(players, original);
  assert.deepEqual(
    teams.flat().sort((a, b) => a - b),
    players,
  );
  assert.equal(new Set(teams.flat()).size, 17);
  assert.equal(
    Math.max(...teams.map((t) => t.length)) -
      Math.min(...teams.map((t) => t.length)),
    1,
  );
  assert.throws(() => drawTeams([1], 2));
  assert.throws(() => drawTeams(players, 1));
});

test("cancelamento fecha exatamente 30 minutos antes", () => {
  const kickoff = new Date("2030-01-01T20:00:00Z");
  assert.doesNotThrow(() =>
    assertCancellationOpen(kickoff, new Date("2030-01-01T19:29:59.999Z")),
  );
  assert.throws(() =>
    assertCancellationOpen(kickoff, new Date("2030-01-01T19:30:00Z")),
  );
  assert.throws(() => assertCancellationOpen(kickoff, kickoff));
});

test("não aceita presença em partida cancelada ou iniciada", () => {
  const now = new Date("2030-01-01T20:00:00Z");
  assert.throws(() =>
    assertRegistrationOpen(
      { status: "canceled", scheduledAt: new Date("2030-01-02") },
      now,
    ),
  );
  assert.throws(() =>
    assertRegistrationOpen({ status: "scheduled", scheduledAt: now }, now),
  );
});

test("senhas usam salt aleatório e validam somente a senha correta", async () => {
  const first = await hashPassword("senha-longa-de-teste");
  const second = await hashPassword("senha-longa-de-teste");
  assert.notEqual(first, second);
  assert.equal(await verifyPassword("senha-longa-de-teste", first), true);
  assert.equal(await verifyPassword("senha-incorreta", first), false);
});
