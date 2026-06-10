import { Link } from 'react-router-dom';
import { MotionPage } from '../design/primitives/Stat';
import { Button } from '../design/primitives/Button';

export function NotFoundPage() {
  return (
    <MotionPage className="flex min-h-screen flex-col items-center justify-center gap-6 pitch-bg p-6 text-center">
      <span className="text-6xl" aria-hidden>
        ⚽
      </span>
      <h1 className="font-display text-7xl font-bold text-[var(--accent-green)] md:text-8xl">404</h1>
      <p className="font-body text-lg text-[var(--fg-1)]">This page is offside.</p>
      <Link to="/">
        <Button>Return Home</Button>
      </Link>
    </MotionPage>
  );
}
