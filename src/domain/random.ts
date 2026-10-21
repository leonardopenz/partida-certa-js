// Amostragem sem viés de módulo. A função injetável permite testes determinísticos.
export function randomIndex(maxExclusive: number): number {
  const range = 2 ** 32;
  const limit = range - (range % maxExclusive);
  const buffer = new Uint32Array(1);
  do {
    globalThis.crypto.getRandomValues(buffer);
  } while (buffer[0] >= limit);
  return buffer[0] % maxExclusive;
}

export function shuffle<T>(
  values: readonly T[],
  pick: (max: number) => number,
): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = pick(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
