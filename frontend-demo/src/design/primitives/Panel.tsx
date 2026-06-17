import type { ReactNode } from 'react';
import { motion } from 'motion/react';

interface PanelProps {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
}

export function Panel({ children, className = '', title, action }: PanelProps) {
  return (
    <motion.section
      className={`pitch-card pitch-card-top overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {(title || action) && (
        <header className="flex items-center justify-between border-b border-[var(--panel-border)] bg-[var(--bg-0)]/40 px-5 py-4">
          {title && (
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-[var(--accent-green)]">
              {title}
            </h2>
          )}
          {action}
        </header>
      )}
      <div className="p-5">{children}</div>
    </motion.section>
  );
}
