export function LoadingState({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[var(--panel-border)] border-t-[var(--accent-green)]" />
      <p className="font-body text-sm font-medium text-[var(--fg-1)]">{message}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <p className="font-body text-sm text-[var(--accent-orange)]">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="font-body text-sm font-semibold text-[var(--accent-green)] underline-offset-4 hover:underline"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <span className="text-3xl" aria-hidden>
        ⚽
      </span>
      <h3 className="font-display text-lg font-semibold text-[var(--fg-0)]">{title}</h3>
      {description && <p className="max-w-sm font-body text-sm text-[var(--fg-2)]">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
