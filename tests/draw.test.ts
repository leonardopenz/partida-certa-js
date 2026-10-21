import { test } from "node:test";
import assert from "node:assert/strict";
import {
  drawTeams,
  formatTeams,
  parsePlayers,
  randomIndex,
  validateDraw,
} from "../src/domain/draw";

test("interpreta quebras Windows, espaços e GK sem diferenciar maiúsculas", () => {
  const result = parsePlayers(
    "  João (GK) \r\n\r\n Pedro \r\nCarlos (gk)\nAna",
  );
  assert.deepEqual(
    result.players.map((p) => [p.name, p.goalkeeper]),
    [
      ["João", true],
      ["Pedro", false],
      ["Carlos", true],
      ["Ana", false],
    ],
  );
  assert.deepEqual(result.errors, []);
});

test("informa nomes repetidos e goleiro sem nome sem descartar jogador repetido", () => {
  const result = parsePlayers("João (GK)\njoão\n (GK)\nCarlos (GK)");
  assert.equal(result.players.length, 3);
  assert.equal(result.errors.length, 2);
  assert.match(result.errors[0], /Nome repetido/);
  assert.match(result.errors[1], /Linha 3/);
  assert.throws(() => drawTeams(result, 2));
});

test("valida entrada vazia, número de times e quantidade exata de goleiros", () => {
  assert.match(validateDraw(parsePlayers(""), 2).join(), /Digite/);
  for (const count of [0, 1, 2.5, NaN, Infinity])
    assert.ok(validateDraw(parsePlayers("A (GK)\nB (GK)"), count).length);
  assert.match(
    validateDraw(parsePlayers("A (GK)\nB\nC"), 3).join(),
    /Marque mais 2 jogadores/,
  );
  assert.match(
    validateDraw(parsePlayers("A (GK)\nB (GK)\nC (GK)"), 2).join(),
    /Retire \(GK\) de 1 jogador/,
  );
});

test("todos os jogadores aparecem uma vez, com 1 GK e diferença máxima de 1 por time", () => {
  for (const count of [2, 3, 4, 7]) {
    for (const outfieldCount of [0, 1, 5, 17, 50]) {
      const parsed = parsePlayers(
        [
          ...Array.from({ length: count }, (_, i) => `GK ${i} (GK)`),
          ...Array.from({ length: outfieldCount }, (_, i) => `Jogador ${i}`),
        ].join("\n"),
      );
      const before = JSON.stringify(parsed);
      const teams = drawTeams(parsed, count);
      const sizes = teams.map((t) => t.players.length);
      assert.equal(teams.length, count);
      assert.ok(
        teams.every((t) => t.players.filter((p) => p.goalkeeper).length === 1),
      );
      assert.ok(Math.max(...sizes) - Math.min(...sizes) <= 1);
      assert.deepEqual(
        teams.flatMap((t) => t.players.map((p) => p.id)).sort(),
        parsed.players.map((p) => p.id).sort(),
      );
      assert.equal(JSON.stringify(parsed), before);
    }
  }
});

test("embaralha também quais times recebem jogadores excedentes", () => {
  const parsed = parsePlayers("A (GK)\nB (GK)\nC (GK)\nD");
  const teams = drawTeams(parsed, 3, () => 0);
  assert.deepEqual(
    teams.map((t) => t.players.length),
    [1, 2, 1],
  );
  assert.deepEqual(
    formatTeams(
      drawTeams(parsePlayers("João (GK)\nCarlos (GK)"), 2, (max) => max - 1),
    ),
    "⚽ PARTIDA CERTA — TIMES SORTEADOS\n\n*TIME 1*\n🧤 João (GK)\n\n*TIME 2*\n🧤 Carlos (GK)",
  );
});

test("gerador retorna somente índices válidos", () => {
  for (let i = 0; i < 100; i++) {
    const value = randomIndex(7);
    assert.ok(Number.isInteger(value) && value >= 0 && value < 7);
  }
});
