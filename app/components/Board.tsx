import type { Evaluation } from '@/lib/wordle';
import { MAX_GUESSES, WORD_LENGTH } from '@/lib/wordle';

interface Props {
  guesses: string[];
  evaluations: Evaluation[][];
  currentGuess: string;
  invalid: boolean;
}

export default function Board({ guesses, evaluations, currentGuess, invalid }: Props) {
  const rows = [];
  for (let r = 0; r < MAX_GUESSES; r++) {
    const submitted = r < guesses.length;
    const isCurrent = r === guesses.length;
    const letters = submitted
      ? guesses[r].split('')
      : isCurrent
        ? currentGuess.padEnd(WORD_LENGTH, ' ').split('')
        : new Array(WORD_LENGTH).fill(' ');
    const evals = submitted ? evaluations[r] : null;

    rows.push(
      <div key={r} className={`row ${isCurrent && invalid ? 'shake' : ''}`}>
        {letters.map((letter, c) => {
          const filled = letter !== ' ';
          let cls = 'tile';
          if (evals) {
            cls += ` ${evals[c]} revealed`;
            cls += ` delay-${c}`;
          } else if (filled) {
            cls += ' filled';
          } else {
            cls += ' empty';
          }
          return (
            <div key={c} className={cls}>
              {filled ? letter.toUpperCase() : ''}
            </div>
          );
        })}
      </div>,
    );
  }
  return <div className="board">{rows}</div>;
}
