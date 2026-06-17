interface MarqueeTickerProps {
  items: string[];
}

export function MarqueeTicker({ items }: MarqueeTickerProps) {
  const text = items.length ? items.join('   ⚽   ') : 'No live fixtures right now';
  const doubled = `${text}   ⚽   ${text}`;

  return (
    <div className="relative overflow-hidden bg-[var(--accent-green)]">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[var(--accent-green)] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[var(--accent-green)] to-transparent" />
      <div className="flex whitespace-nowrap py-2">
        <span className="animate-marquee font-stat text-sm font-semibold uppercase tracking-wider text-white">
          {doubled}
        </span>
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-block;
          min-width: 200%;
          animation: marquee 22s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-marquee { animation: none; min-width: auto; }
        }
      `}</style>
    </div>
  );
}
