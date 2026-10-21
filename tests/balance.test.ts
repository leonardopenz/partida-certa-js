import { test } from "node:test";
import assert from "node:assert/strict";
import {
  drawTeams,
  formatTeams,
  parsePlayers,
  playerKey,
  retainRatings,
  validateDraw,
  type ParsedPlayers,
} from "../src/domain/draw";
import { averageStars } from "../src/domain/balance";

function rated(names: string, values: (number | null)[]): ParsedPlayers {
  const parsed = parsePlayers(names);
  return {
    ...parsed,
    players: parsed.players.map((p, i) => ({ ...p, stars: values[i] })),
  };
}
function seeded(seed: number) {
  return (max: number) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % max;
  };
}

test("zero é válido, ausência e valores fora dos meios pontos impedem o equilíbrio", () => {
  const parsed = rated("A (GK)\nB (GK)\nC\nD", [0, 0.5, 5, null]);
  assert.match(validateDraw(parsed, 2, false, "balanced").join(), /D/);
  assert.throws(() => drawTeams(parsed, 2, { mode: "balanced" }));
  parsed.players[3].stars = 0;
  assert.deepEqual(validateDraw(parsed, 2, false, "balanced"), []);
  for (const value of [-0.5, 5.5, 1.2, NaN, Infinity]) {
    parsed.players[3].stars = value;
    assert.ok(validateDraw(parsed, 2, false, "balanced").length);
  }
  assert.deepEqual(validateDraw(parsed, 2), []);
});

test("goleiros distribuídos entram no equilíbrio e são compensados pelos jogadores de linha", () => {
  const parsed = rated("G1 (GK)\nG2 (GK)\nCraque\nIniciante", [5, 0, 5, 0]);
  const teams = drawTeams(parsed, 2, { mode: "balanced", pick: seeded(42) });
  assert.deepEqual(teams.map(averageStars), [2.5, 2.5]);
  assert.ok(
    teams.every((t) => t.players.filter((p) => p.goalkeeper).length === 1),
  );
});

test("equilíbrio preserva tamanhos, posições, avaliações e todos os participantes", () => {
  for (const fixed of [false, true]) {
    for (const count of [2, 3, 5]) {
      const names = [
        ...Array.from({ length: fixed ? 2 : count }, (_, i) => `G${i} (GK)`),
        ...Array.from({ length: 17 }, (_, i) => `P${i}`),
      ].join("\n");
      const parsed = parsePlayers(names);
      parsed.players = parsed.players.map((p, i) => ({
        ...p,
        stars: fixed && p.goalkeeper ? null : (i % 11) / 2,
      }));
      const before = JSON.stringify(parsed);
      const teams = drawTeams(parsed, count, {
        mode: "balanced",
        fixedGoalkeepers: fixed,
        pick: seeded(count),
      });
      const expected = parsed.players.filter((p) => !fixed || !p.goalkeeper);
      assert.equal(teams.length, count);
      assert.deepEqual(
        teams.flatMap((t) => t.players.map((p) => p.id)).sort(),
        expected.map((p) => p.id).sort(),
      );
      assert.ok(
        teams.every(
          (t) =>
            t.players.filter((p) => p.goalkeeper).length === (fixed ? 0 : 1),
        ),
      );
      const sizes = teams.map((t) => t.players.length);
      assert.ok(Math.max(...sizes) - Math.min(...sizes) <= 1);
      assert.equal(JSON.stringify(parsed), before);
    }
  }
});

test("distribui níveis altos e baixos uniformemente numa solução conhecida", () => {
  const parsed = rated("A\nB\nC\nD\nE\nF", [5, 5, 5, 0, 0, 0]);
  const teams = drawTeams(parsed, 3, {
    mode: "balanced",
    fixedGoalkeepers: true,
    pick: seeded(9),
  });
  assert.deepEqual(teams.map(averageStars), [2.5, 2.5, 2.5]);
  const zero = drawTeams(rated("A\nB\nC", [0, 0, 0]), 3, {
    mode: "balanced",
    fixedGoalkeepers: true,
  });
  assert.deepEqual(zero.map(averageStars), [0, 0, 0]);
});

test("WhatsApp não inclui avaliações individuais ou médias", () => {
  const parsed = rated("A\nB\nC\nD", [0.5, 2.5, 4.5, 5]);
  const text = formatTeams(
    drawTeams(parsed, 2, { mode: "balanced", fixedGoalkeepers: true }),
    [],
  );
  assert.doesNotMatch(text, /estrela|média|★|0[.,]5|2[.,]5|4[.,]5/);
});

test("avaliações acompanham nomes na reordenação e removidos deixam de ser guardados", () => {
  const previous = { [playerKey("João")]: 0, [playerKey("Pedro")]: 3.5 };
  const next = retainRatings(previous, parsePlayers("PEDRO\nJoão (GK)\nNovo"));
  assert.deepEqual(next, previous);
  const removed = retainRatings(next, parsePlayers("João"));
  assert.deepEqual(removed, { [playerKey("João")]: 0 });
  assert.deepEqual(
    retainRatings(removed, parsePlayers("João\nPedro")),
    removed,
  );
});
