import { useEffect, useRef } from 'react';
import { motion, useSpring, useTransform } from 'motion/react';

interface StatProps {
  label: string;
  value: number;
  suffix?: string;
  className?: string;
  accent?: 'green' | 'orange';
}

export function Stat({ label, value, suffix = '', className = '', accent = 'green' }: StatProps) {
  const spring = useSpring(0, { stiffness: 80, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v));
  const ref = useRef<HTMLSpanElement>(null);
  const color =
    accent === 'orange' ? 'text-[var(--accent-gold)]' : 'text-[var(--accent-green)]';

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    return display.on('change', (v) => {
      if (ref.current) ref.current.textContent = `${v}${suffix}`;
    });
  }, [display, suffix]);

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span className="font-body text-xs font-semibold uppercase tracking-wide text-[var(--fg-2)]">{label}</span>
      <span ref={ref} className={`font-stat text-4xl font-bold leading-none ${color}`}>
        0{suffix}
      </span>
    </div>
  );
}

export function StatInline({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-body text-xs font-semibold uppercase tracking-wide text-[var(--fg-2)]">{label}</span>
      <span className="font-stat text-2xl font-bold text-[var(--accent-green)]">{value}</span>
    </div>
  );
}

export function MotionPage({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
