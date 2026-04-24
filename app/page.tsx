'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Board from './components/Board';
import Keyboard from './components/Keyboard';
import SettingsModal from './components/SettingsModal';
import Toast from './components/Toast';
import type { Evaluation } from '@/lib/wordle';
import { MAX_GUESSES, WORD_LENGTH } from '@/lib/wordle';

type GameStatus = 'playing' | 'won' | 'lost';

interface GameState {
  guesses: string[];
  evaluations: Evaluation[][];
  status: GameStatus;
  version: number;
  answer?: string;
}

const GEAR_ICON = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const STORAGE_KEY = 'wordle:game';

function emptyGame(version: number): GameState {
  return { guesses: [], evaluations: [], status: 'playing', version };
}

export default function Home() {
  const [isSet, setIsSet] = useState<boolean | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [game, setGame] = useState<GameState | null>(null);
  const [currentGuess, setCurrentGuess] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [invalidRow, setInvalidRow] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string, ms = 2000) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), ms);
  }, []);

  const triggerInvalid = useCallback(() => {
    setInvalidRow(true);
    setTimeout(() => setInvalidRow(false), 550);
  }, []);

  const saveGame = useCallback((next: GameState) => {
    setGame(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore quota / privacy errors
    }
  }, []);

  const loadOrResetGame = useCallback((version: number) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: GameState = JSON.parse(raw);
        if (parsed && parsed.version === version) {
          setGame(parsed);
          return;
        }
      }
    } catch {
      // fall through to reset
    }
    const fresh = emptyGame(version);
    saveGame(fresh);
  }, [saveGame]);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status', { cache: 'no-store' });
      const data = await res.json();
      setIsSet(!!data.isSet);
      loadOrResetGame(Number(data.version) || 0);
    } catch {
      setIsSet(false);
      showToast('Could not reach the server.');
    }
  }, [loadOrResetGame, showToast]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const submitGuess = useCallback(async () => {
    if (!game || submitting) return;
    if (isSet === false) {
      showToast('No word set yet — open settings to set one.');
      return;
    }
    if (game.status !== 'playing') return;
    if (currentGuess.length !== WORD_LENGTH) {
      showToast('Not enough letters');
      triggerInvalid();
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guess: currentGuess }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data?.error ?? 'Something went wrong');
        triggerInvalid();
        return;
      }
      const evaluation: Evaluation[] = data.evaluation;
      const correct: boolean = data.correct;
      const guesses = [...game.guesses, currentGuess];
      const evaluations = [...game.evaluations, evaluation];
      let status: GameStatus = 'playing';
      let answer = game.answer;
      if (correct) {
        status = 'won';
      } else if (guesses.length >= MAX_GUESSES) {
        status = 'lost';
        try {
          const wr = await fetch('/api/word', { cache: 'no-store' });
          const wd = await wr.json();
          if (typeof wd?.word === 'string') answer = wd.word.toUpperCase();
        } catch {
          // best effort
        }
      }
      saveGame({ ...game, guesses, evaluations, status, answer });
      setCurrentGuess('');
      const flipDelay = 1600;
      if (status === 'won') {
        setTimeout(() => showToast('You got it!', 2500), flipDelay);
      } else if (status === 'lost') {
        setTimeout(
          () => showToast(answer ? `The word was ${answer}` : 'Out of guesses', 4000),
          flipDelay,
        );
      }
    } finally {
      setSubmitting(false);
    }
  }, [game, currentGuess, isSet, submitting, showToast, triggerInvalid, saveGame]);

  const handleKey = useCallback(
    (key: string) => {
      if (!game || game.status !== 'playing' || isSet === false) return;
      if (key === 'ENTER') {
        submitGuess();
      } else if (key === 'BACKSPACE') {
        setCurrentGuess((g) => g.slice(0, -1));
      } else if (/^[A-Z]$/.test(key)) {
        setCurrentGuess((g) => (g.length < WORD_LENGTH ? g + key.toLowerCase() : g));
      }
    },
    [game, isSet, submitGuess],
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (settingsOpen) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Enter') handleKey('ENTER');
      else if (e.key === 'Backspace') handleKey('BACKSPACE');
      else if (e.key.length === 1) {
        const k = e.key.toUpperCase();
        if (/^[A-Z]$/.test(k)) handleKey(k);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleKey, settingsOpen]);

  const statusLabel =
    isSet === null ? 'Loading…' : isSet ? 'Word is set — ready to play' : 'No word set';

  return (
    <main>
      <header className="header">
        <button
          className="icon-btn"
          onClick={() => setSettingsOpen(true)}
          aria-label="Open settings"
        >
          {GEAR_ICON}
        </button>
        <h1>Wordle</h1>
        <div className={`status ${isSet ? 'is-set' : isSet === false ? 'is-unset' : ''}`} aria-live="polite">
          <span className={`dot ${isSet ? 'set' : 'unset'}`} aria-hidden="true" />
          <span className="status-text">{statusLabel}</span>
        </div>
      </header>

      <div className="game">
        <div className="board-wrap">
          {game && (
            <Board
              guesses={game.guesses}
              evaluations={game.evaluations}
              currentGuess={currentGuess}
              invalid={invalidRow}
            />
          )}
          {isSet === false && (
            <div className="board-overlay">
              <div className="overlay-title">No word has been set yet</div>
              <div className="overlay-desc">Set a word so players can start guessing.</div>
              <button className="btn primary" onClick={() => setSettingsOpen(true)}>
                Set a word
              </button>
            </div>
          )}
          {game && game.status !== 'playing' && isSet && (
            <div className="end-banner">
              {game.status === 'won'
                ? `Solved in ${game.guesses.length} / ${MAX_GUESSES}`
                : game.answer
                  ? `The word was ${game.answer}`
                  : 'Out of guesses'}
            </div>
          )}
        </div>

        <Keyboard
          onKey={handleKey}
          guesses={game?.guesses ?? []}
          evaluations={game?.evaluations ?? []}
        />
      </div>

      {toast && <Toast message={toast} />}

      {settingsOpen && (
        <SettingsModal
          onClose={() => setSettingsOpen(false)}
          onSaved={() => {
            setSettingsOpen(false);
            try {
              localStorage.removeItem(STORAGE_KEY);
            } catch {
              // ignore
            }
            fetchStatus();
            showToast('Word saved. Game reset.');
          }}
        />
      )}
    </main>
  );
}
