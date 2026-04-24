export type Evaluation = 'correct' | 'present' | 'absent';

export const WORD_LENGTH = 5;
export const MAX_GUESSES = 6;

export function evaluateGuess(guess: string, answer: string): Evaluation[] {
  const g = guess.toLowerCase();
  const a = answer.toLowerCase();
  const result: Evaluation[] = new Array(WORD_LENGTH).fill('absent');
  const remaining: (string | null)[] = a.split('');

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (g[i] === remaining[i]) {
      result[i] = 'correct';
      remaining[i] = null;
    }
  }
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] === 'correct') continue;
    const idx = remaining.indexOf(g[i]);
    if (idx !== -1) {
      result[i] = 'present';
      remaining[idx] = null;
    }
  }
  return result;
}
