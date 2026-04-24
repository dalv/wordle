import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Wordle',
  description: 'A Wordle clone where someone sets the word and others guess.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
