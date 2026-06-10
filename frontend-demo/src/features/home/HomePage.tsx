import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Button } from '../../design/primitives/Button';
import { BadgeChip } from '../../design/primitives/BadgeChip';

const liveScores = ['ARS 2–1 CHE', 'LIV 1–0 MUN', 'MCI vs TOT 17:30'];

const features = [
  { icon: '👕', title: 'Build your squad', desc: 'Pick 11 players, set your formation, name a captain.' },
  { icon: '🏆', title: 'Join leagues', desc: 'Compete with friends on weekly leaderboards.' },
  { icon: '📊', title: 'Track live points', desc: 'Goals, assists, clean sheets — scored automatically.' },
];

function HeroPitch() {
  return (
    <div className="pointer-events-none absolute right-0 top-0 hidden h-full w-1/3 opacity-30 lg:block" aria-hidden>
      <svg viewBox="0 0 200 300" className="h-full w-full" preserveAspectRatio="xMaxYMid slice">
        <defs>
          <pattern id="grass" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="10" height="20" fill="#4caf6a" />
            <rect x="10" width="10" height="20" fill="#3d9e59" />
          </pattern>
        </defs>
        <rect width="200" height="300" fill="url(#grass)" />
        <rect x="10" y="10" width="180" height="280" fill="none" stroke="white" strokeWidth="2" />
        <line x1="100" y1="10" x2="100" y2="290" stroke="white" strokeWidth="1.5" />
        <circle cx="100" cy="150" r="30" fill="none" stroke="white" strokeWidth="1.5" />
        <circle cx="100" cy="150" r="4" fill="white" />
      </svg>
    </div>
  );
}

export function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden pitch-bg">
      <header className="relative z-10 border-b border-[var(--panel-border)] bg-white/90 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden>
              ⚽
            </span>
            <div>
              <p className="font-display text-xl font-bold text-[var(--accent-green)]">Fantasy Soccer</p>
              <p className="font-body text-xs text-[var(--fg-2)]">Build. Compete. Win.</p>
            </div>
          </div>
          <Link to="/login">
            <Button variant="ghost" className="text-sm">
              Sign in
            </Button>
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden bg-[var(--accent-green)] px-6 py-16 text-white">
        <HeroPitch />
        <div className="relative z-10 mx-auto max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <p className="font-body text-sm font-semibold uppercase tracking-widest text-white/80">Matchday Fantasy</p>
            <h1 className="mt-2 font-display text-5xl font-bold leading-tight md:text-6xl">
              Your squad.
              <br />
              Your league.
            </h1>
            <p className="mt-4 max-w-md font-body text-lg text-white/90">
              Pick your players, join a league with friends, and climb the leaderboard every gameweek.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/register">
                <Button className="bg-white px-8 py-3 text-base !text-black hover:bg-white/90">
                  Get Started
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="ghost" className="border-white/40 px-8 py-3 text-base text-black hover:border-white hover:bg-white/10">
                  Sign in
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <main className="relative z-10 mx-auto max-w-5xl px-6 py-12">
        <div className="pitch-card pitch-card-top overflow-hidden">
          <div className="flex items-center gap-3 border-b border-[var(--panel-border)] bg-[var(--bg-0)]/50 px-4 py-3">
            <BadgeChip tone="orange">Live</BadgeChip>
            <span className="font-display text-sm font-semibold uppercase tracking-wide text-[var(--fg-1)]">
              Today&apos;s Fixtures
            </span>
          </div>
          <div className="flex flex-wrap gap-8 px-4 py-4">
            {liveScores.map((score) => (
              <span key={score} className="font-stat text-base font-semibold text-[var(--fg-0)]">
                {score}
              </span>
            ))}
          </div>
        </div>

        <section className="mt-12 grid gap-6 md:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className="pitch-card p-6 transition-shadow hover:shadow-[var(--glow-green)]"
            >
              <span className="text-2xl" aria-hidden>
                {f.icon}
              </span>
              <h3 className="mt-3 font-display text-lg font-semibold text-[var(--fg-0)]">{f.title}</h3>
              <p className="mt-2 font-body text-sm text-[var(--fg-2)]">{f.desc}</p>
            </motion.div>
          ))}
        </section>
      </main>
    </div>
  );
}
