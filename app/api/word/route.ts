import { NextResponse } from 'next/server';
import { clearWord, getWord, setWord } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const word = await getWord();
    return NextResponse.json({ word });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const word = typeof body?.word === 'string' ? body.word.trim() : '';
    if (word === '') {
      const version = await clearWord();
      return NextResponse.json({ ok: true, cleared: true, version });
    }
    if (!/^[a-zA-Z]{5}$/.test(word)) {
      return NextResponse.json({ error: 'Word must be exactly 5 letters.' }, { status: 400 });
    }
    const version = await setWord(word);
    return NextResponse.json({ ok: true, version });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 });
  }
}
