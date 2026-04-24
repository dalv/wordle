import { NextResponse } from 'next/server';
import { getWord } from '@/lib/storage';
import { evaluateGuess } from '@/lib/wordle';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const guess = typeof body?.guess === 'string' ? body.guess.trim() : '';
    if (!/^[a-zA-Z]{5}$/.test(guess)) {
      return NextResponse.json({ error: 'Guess must be exactly 5 letters.' }, { status: 400 });
    }
    const word = await getWord();
    if (!word) {
      return NextResponse.json({ error: 'No word has been set yet.' }, { status: 400 });
    }
    const evaluation = evaluateGuess(guess, word);
    const correct = evaluation.every((e) => e === 'correct');
    return NextResponse.json({ evaluation, correct });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 });
  }
}
