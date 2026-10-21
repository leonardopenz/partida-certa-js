import { randomIndex, shuffle } from "./random";
import { balanceTeams } from "./balance";
export { randomIndex } from "./random";
export type DrawMode = "random" | "balanced";

export interface Player {
  id: string;
  name: string;
  goalkeeper: boolean;
  stars?: number | null;
}
export interface Team {
  name: string;
  players: Player[];
}
export interface ParsedPlayers {
  players: Player[];
  errors: string[];
}

export const playerKey = (name: string) =>
  name.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");

// Guardar avaliações pelo nome normalizado preserva-as ao reordenar a lista.
export function retainRatings(
  ratings: Record<string, number>,
  parsed: ParsedPlayers,
): Record<string, number> {
  const keys = new Set(parsed.players.map((p) => playerKey(p.name)));
  return Object.fromEntries(
    Object.entries(ratings).filter(([key]) => keys.has(key)),
  );
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

export function validateDraw(
  parsed: ParsedPlayers,
  count: number,
  fixedGoalkeepers = false,
  mode: DrawMode = "random",
): string[] {
  const errors = [...parsed.errors];
  if (!Number.isSafeInteger(count) || count < 2)
    return [...errors, "Informe uma quantidade inteira de pelo menos 2 times."];
  if (!parsed.players.length)
    return [...errors, "Digite os nomes dos jogadores, um por linha."];
  if (mode === "balanced") {
    const invalid = parsed.players.filter(
      (p) =>
        !(fixedGoalkeepers && p.goalkeeper) &&
        (p.stars == null ||
          !Number.isFinite(p.stars) ||
          p.stars < 0 ||
          p.stars > 5 ||
          !Number.isInteger(p.stars * 2)),
    );
    if (invalid.length)
      errors.push(
        `Avalie todos os participantes do sorteio com 0 a 5 estrelas, em passos de meia estrela. Faltam avaliações válidas para: ${invalid
          .slice(0, 5)
          .map((p) => p.name)
          .join(", ")}${invalid.length > 5 ? "…" : ""}.`,
      );
  }
  if (fixedGoalkeepers) {
    const outfieldCount = parsed.players.filter((p) => !p.goalkeeper).length;
    if (outfieldCount < count)
      errors.push(
        `Para montar ${count} times de linha, informe pelo menos ${count} jogadores de linha. Os goleiros fixos não entram nessa conta.`,
      );
    return errors;
  }
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

export function drawTeams(
  parsed: ParsedPlayers,
  count: number,
  options: {
    fixedGoalkeepers?: boolean;
    pick?: (max: number) => number;
    mode?: DrawMode;
  } = {},
): Team[] {
  const {
    fixedGoalkeepers = false,
    pick = randomIndex,
    mode = "random",
  } = options;
  const errors = validateDraw(parsed, count, fixedGoalkeepers, mode);
  if (errors.length) throw new Error(errors.join("\n"));
  if (mode === "balanced")
    return balanceTeams(parsed.players, count, fixedGoalkeepers, pick);
  const keepers = shuffle(
    parsed.players.filter((p) => p.goalkeeper),
    pick,
  );
  const outfield = shuffle(
    parsed.players.filter((p) => !p.goalkeeper),
    pick,
  );
  const teams: Team[] = Array.from({ length: count }, (_, i) => ({
    name: `Time ${i + 1}`,
    players: fixedGoalkeepers ? [] : [keepers[i]],
  }));
  const order = shuffle(
    teams.map((_, i) => i),
    pick,
  );
  outfield.forEach((player, i) => teams[order[i % count]].players.push(player));
  return teams;
}

export function formatTeams(
  teams: readonly Team[],
  fixedGoalkeepers?: readonly Player[],
): string {
  return [
    "⚽ PARTIDA CERTA — TIMES SORTEADOS",
    ...(fixedGoalkeepers
      ? [
          "🔄 Times de linha — goleiros fixos fora do sorteio",
          ...(fixedGoalkeepers.length
            ? [
                [
                  "*GOLEIROS FIXOS*",
                  ...fixedGoalkeepers.map((player) => `🧤 ${player.name} (GK)`),
                ].join("\n"),
              ]
            : []),
        ]
      : []),
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
