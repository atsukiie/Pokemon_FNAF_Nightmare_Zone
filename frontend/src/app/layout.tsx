import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Player Status | Nightmare Zone Admin',
  icons: { icon: '/pokemon-admin-logo.webp' },
  description: 'Pokémon × FNAF: Nightmare Zone admin analytics. Your Data. Your Strategy. Your Next Move.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
