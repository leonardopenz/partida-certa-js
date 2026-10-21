export interface Player {
  id: string;
  name: string;
  goalkeeper: boolean;
}
export interface Team {
  name: string;
  players: Player[];
}
export interface ParsedPlayers {
  players: Player[];
  errors: string[];
}

export function parsePlayers(text: string): ParsedPlayers {
  const players: Player[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();
  text.split(/\r?\n/).forEach((line, index) => {
    const value = line.trim();
    if (!value) return;
    const goalkeeper = /\(gk\)\s*$/i.test(value);
    const name = value.replace(/\(gk\)\s*$/i, "").trim();
    if (!name) {
      errors.push(
        `Linha ${index + 1}: informe o nome do goleiro antes de (GK).`,
      );
      return;
    }
    const key = name
      .normalize("NFC")
      .replace(/\s+/g, " ")
      .toLocaleLowerCase("pt-BR");
    if (seen.has(key))
      errors.push(
        `Nome repetido: ${name}. Diferencie os jogadores, por exemplo, João A e João B.`,
      );
    seen.add(key);
    players.push({ id: `player-${index}`, name, goalkeeper });
  });
  return { players, errors };
}

export function validateDraw(parsed: ParsedPlayers, count: number): string[] {
  const errors = [...parsed.errors];
  if (!Number.isSafeInteger(count) || count < 2)
    return [...errors, "Informe uma quantidade inteira de pelo menos 2 times."];
  if (!parsed.players.length)
    return [...errors, "Digite os nomes dos jogadores, um por linha."];
  if (count > parsed.players.length)
    errors.push(
      "A quantidade de times não pode ser maior que a quantidade de jogadores.",
    );
  const keepers = parsed.players.filter((p) => p.goalkeeper).length;
  if (keepers < count) {
    const missing = count - keepers;
    errors.push(
      `Você escolheu ${count} times, mas identificou ${keepers} ${keepers === 1 ? "goleiro" : "goleiros"}. Marque mais ${missing} ${missing === 1 ? "jogador" : "jogadores"} com (GK).`,
    );
  } else if (keepers > count) {
    errors.push(
      `Você identificou ${keepers} goleiros para ${count} times. Retire (GK) de ${keepers - count} ${keepers - count === 1 ? "jogador que vai" : "jogadores que vão"} jogar na linha: cada time deve ter exatamente 1 goleiro.`,
    );
  }
  return errors;
}

// Amostragem sem viés de módulo; a função injetável permite testes determinísticos.
export function randomIndex(maxExclusive: number): number {
  const range = 2 ** 32;
  const limit = range - (range % maxExclusive);
  const buffer = new Uint32Array(1);
  do {
    globalThis.crypto.getRandomValues(buffer);
  } while (buffer[0] >= limit);
  return buffer[0] % maxExclusive;
}

function shuffle<T>(values: readonly T[], pick: (max: number) => number): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = pick(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function drawTeams(
  parsed: ParsedPlayers,
  count: number,
  pick = randomIndex,
): Team[] {
  const errors = validateDraw(parsed, count);
  if (errors.length) throw new Error(errors.join("\n"));
  const keepers = shuffle(
    parsed.players.filter((p) => p.goalkeeper),
    pick,
  );
  const outfield = shuffle(
    parsed.players.filter((p) => !p.goalkeeper),
    pick,
  );
  const teams: Team[] = keepers.map((keeper, i) => ({
    name: `Time ${i + 1}`,
    players: [keeper],
  }));
  const order = shuffle(
    teams.map((_, i) => i),
    pick,
  );
  outfield.forEach((player, i) => teams[order[i % count]].players.push(player));
  return teams;
}

export function formatTeams(teams: readonly Team[]): string {
  return [
    "⚽ PARTIDA CERTA — TIMES SORTEADOS",
    ...teams.map((team) =>
      [
        `*${team.name.toLocaleUpperCase("pt-BR")}*`,
        ...team.players.map((player) =>
          player.goalkeeper ? `🧤 ${player.name} (GK)` : `• ${player.name}`,
        ),
      ].join("\n"),
    ),
  ].join("\n\n");
}
