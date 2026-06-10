interface BadgeChipProps {
  children: React.ReactNode;
  tone?: 'green' | 'orange' | 'magenta' | 'amber' | 'muted' | 'bronze';
}

const tones = {
  green: 'border-[var(--accent-green)] bg-[var(--accent-green)]/10 text-[var(--accent-green)]',
  orange: 'border-[var(--accent-orange)] bg-red-50 text-[var(--accent-orange)]',
  magenta: 'border-[var(--accent-orange)] bg-red-50 text-[var(--accent-orange)]',
  amber: 'border-[var(--accent-gold)] bg-amber-50 text-[var(--accent-gold)]',
  bronze: 'border-[#b87333] bg-orange-50 text-[#b87333]',
  muted: 'border-[var(--panel-border)] bg-[var(--bg-0)] text-[var(--fg-1)]',
};

export function BadgeChip({ children, tone = 'muted' }: BadgeChipProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-body text-[10px] font-bold uppercase tracking-wide ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function FormChip({ result }: { result: 'W' | 'D' | 'L' }) {
  const tone = result === 'W' ? 'green' : result === 'D' ? 'amber' : 'orange';
  return <BadgeChip tone={tone}>{result}</BadgeChip>;
}

export function RankChip({ rank }: { rank: number }) {
  if (rank === 1) return <BadgeChip tone="green">1st</BadgeChip>;
  if (rank === 2) return <BadgeChip tone="amber">2nd</BadgeChip>;
  if (rank === 3) return <BadgeChip tone="bronze">3rd</BadgeChip>;
  return <BadgeChip tone="muted">{rank}</BadgeChip>;
}
