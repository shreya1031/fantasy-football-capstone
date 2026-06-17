import type { ReactNode } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'orange';
  children: ReactNode;
}

const variants = {
  primary:
    'rounded-lg bg-[var(--accent-green)] text-white hover:bg-[#15663f] shadow-[var(--glow-green)] font-semibold',
  orange:
    'rounded-lg bg-[var(--accent-orange)] text-white hover:bg-[#b91c1c] shadow-[var(--glow-orange)] font-semibold',
  ghost:
    'rounded-lg border border-[var(--hairline)] bg-white text-[var(--fg-0)] hover:border-[var(--accent-green)] hover:text-[var(--accent-green)]',
  danger:
    'rounded-lg border border-[var(--accent-orange)]/40 text-[var(--accent-orange)] hover:bg-red-50',
};

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center px-5 py-2.5 font-body text-sm transition-all disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="w-full rounded-lg border border-[var(--panel-border)] bg-white px-3 py-2.5 font-body text-sm text-[var(--fg-0)] placeholder:text-[var(--fg-2)] focus:border-[var(--accent-green)] focus:shadow-[var(--glow-green)]"
      {...props}
    />
  );
}

export function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block font-body text-xs font-semibold uppercase tracking-wide text-[var(--fg-1)]">
      {children}
    </label>
  );
}
