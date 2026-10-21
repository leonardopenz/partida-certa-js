import type { Player, Team } from "./draw";
import { shuffle } from "./random";

export const averageStars = (team: Team) =>
  team.players.reduce((sum, p) => sum + (p.stars ?? 0), 0) /
  team.players.length;

// Heurística com múltiplas tentativas e trocas da mesma posição. Não promete ótimo global.
export function balanceTeams(
  players: Player[],
  count: number,
  fixed: boolean,
  pick: (max: number) => number,
): Team[] {
  const included = players.filter((p) => !fixed || !p.goalkeeper);
  const target =
    included.reduce((sum, p) => sum + p.stars!, 0) / included.length;
  const contribution = (sum: number, size: number) =>
    (sum / size - target) ** 2;
  const cost = (teams: Team[]) =>
    teams.reduce((sum, team) => sum + (averageStars(team) - target) ** 2, 0);
  let best: Team[] = [];
  let bestScore = Infinity;
  // Orçamento global de comparações evita travar a página em listas grandes.
  let comparisons = 200_000;
  for (let attempt = 0; attempt < 24; attempt++) {
    const order = shuffle(
      Array.from({ length: count }, (_, i) => i),
      pick,
    );
    const capacities = Array(count).fill(
      Math.floor(included.length / count),
    ) as number[];
    order.slice(0, included.length % count).forEach((i) => capacities[i]++);
    const keepers = fixed
      ? []
      : shuffle(
          included.filter((p) => p.goalkeeper),
          pick,
        );
    const teams: Team[] = Array.from({ length: count }, (_, i) => ({
      name: `Time ${i + 1}`,
      players: fixed ? [] : [keepers[i]],
    }));
    const sums = teams.map((t) =>
      t.players.reduce((sum, p) => sum + p.stars!, 0),
    );
    // Embaralhar antes de ordenar varia jogadores de mesma avaliação.
    const outfield = shuffle(
      included.filter((p) => !p.goalkeeper),
      pick,
    ).sort((a, b) => b.stars! - a.stars!);
    for (const player of outfield) {
      const available = shuffle(
        order.filter((i) => teams[i].players.length < capacities[i]),
        pick,
      );
      available.sort(
        (a, b) =>
          (sums[a] + player.stars!) / capacities[a] -
          (sums[b] + player.stars!) / capacities[b],
      );
      const index = available[0];
      teams[index].players.push(player);
      sums[index] += player.stars!;
    }
    for (let pass = 0; pass < 60 && comparisons > 0; pass++) {
      let change: [number, number, number, number, number] | null = null;
      let improvement = -1e-10;
      scan: for (let a = 0; a < count; a++) {
        for (let b = a + 1; b < count; b++) {
          const before =
            contribution(sums[a], capacities[a]) +
            contribution(sums[b], capacities[b]);
          for (let x = 0; x < teams[a].players.length; x++) {
            for (let y = 0; y < teams[b].players.length; y++) {
              if (comparisons-- <= 0) break scan;
              const one = teams[a].players[x],
                two = teams[b].players[y];
              if (one.goalkeeper !== two.goalkeeper) continue;
              const delta = two.stars! - one.stars!;
              const difference =
                contribution(sums[a] + delta, capacities[a]) +
                contribution(sums[b] - delta, capacities[b]) -
                before;
              if (difference < improvement) {
                improvement = difference;
                change = [a, b, x, y, delta];
              }
            }
          }
        }
      }
      if (!change) break;
      const [a, b, x, y, delta] = change;
      [teams[a].players[x], teams[b].players[y]] = [
        teams[b].players[y],
        teams[a].players[x],
      ];
      sums[a] += delta;
      sums[b] -= delta;
    }
    const score = cost(teams);
    if (
      score < bestScore - 1e-10 ||
      (Math.abs(score - bestScore) < 1e-10 && pick(2) === 0)
    ) {
      best = teams;
      bestScore = score;
    }
  }
  return best;
}
