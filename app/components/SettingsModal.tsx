'use client';

import { useEffect, useState } from 'react';

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

export default function SettingsModal({ onClose, onSaved }: Props) {
  const [word, setWord] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/word');
        const data = await res.json();
        const existing = typeof data?.word === 'string' ? data.word : '';
        setWord(existing.toUpperCase());
        setHasExisting(!!existing);
      } catch {
        // ignore — treat as no word
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  async function save() {
    setError(null);
    if (word.length > 0 && !/^[A-Z]{5}$/.test(word)) {
      setError('Word must be exactly 5 letters (or blank to clear).');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? 'Failed to save the word.');
        return;
      }
      onSaved();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save the word.');
    } finally {
      setSaving(false);
    }
  }

  function onInput(v: string) {
    setWord(v.replace(/[^a-zA-Z]/g, '').slice(0, 5).toUpperCase());
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Set the word</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">×</button>
        </div>
        <p className="modal-desc">
          {hasExisting
            ? 'A word is currently set. Change it, or leave it blank and save to clear the word. Either action resets everyone\u2019s game.'
            : 'Enter a 5-letter word. Anyone who visits this URL will try to guess it.'}
        </p>
        <input
          className="word-input"
          type="text"
          maxLength={5}
          value={word}
          placeholder="5 letters"
          onChange={(e) => onInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
          }}
          disabled={!loaded || saving}
          autoFocus
          spellCheck={false}
          autoComplete="off"
        />
        {error && <div className="error">{error}</div>}
        <div className="modal-actions">
          <button className="btn" onClick={onClose} disabled={saving}>Cancel</button>
          <button
            className="btn primary"
            onClick={save}
            disabled={saving || !loaded || (word.length === 0 && !hasExisting)}
          >
            {saving
              ? 'Saving…'
              : word.length === 0 && hasExisting
                ? 'Clear word'
                : hasExisting
                  ? 'Update'
                  : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
