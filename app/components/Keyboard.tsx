'use client';

import type { Evaluation } from '@/lib/wordle';

const ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE'],
];

const PRIORITY: Record<Evaluation, number> = { correct: 3, present: 2, absent: 1 };

interface Props {
  onKey: (key: string) => void;
  guesses: string[];
  evaluations: Evaluation[][];
}

export default function Keyboard({ onKey, guesses, evaluations }: Props) {
  const letterEvals: Record<string, Evaluation> = {};
  for (let r = 0; r < guesses.length; r++) {
    const g = guesses[r];
    const ev = evaluations[r];
    if (!ev) continue;
    for (let i = 0; i < g.length; i++) {
      const L = g[i].toUpperCase();
      const curr = ev[i];
      const prior = letterEvals[L];
      if (!prior || PRIORITY[curr] > PRIORITY[prior]) {
        letterEvals[L] = curr;
      }
    }
  }

  return (
    <div className="keyboard">
      {ROWS.map((row, i) => (
        <div key={i} className="kb-row">
          {row.map((key) => {
            const isAction = key === 'ENTER' || key === 'BACKSPACE';
            const ev = letterEvals[key];
            const cls = `kb-key${isAction ? ' action' : ''}${ev ? ' ' + ev : ''}`;
            return (
              <button
                key={key}
                type="button"
                className={cls}
                onClick={() => onKey(key)}
                aria-label={key === 'BACKSPACE' ? 'Backspace' : key}
              >
                {key === 'BACKSPACE' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                    <line x1="18" y1="9" x2="12" y2="15" />
                    <line x1="12" y1="9" x2="18" y2="15" />
                  </svg>
                ) : (
                  key
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
