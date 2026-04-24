import { NextResponse } from 'next/server';
import { getVersion, getWord } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const [word, version] = await Promise.all([getWord(), getVersion()]);
    return NextResponse.json({ isSet: !!word, version });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 });
  }
}
