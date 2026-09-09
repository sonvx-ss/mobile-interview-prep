import { useEffect, useState, type ReactNode } from 'react'
import { IconChevron } from './Icons'

export function Disclosure({
  title,
  count,
  children,
  open: controlled,
  tone = 'default',
}: {
  title: string
  count?: number
  children: ReactNode
  open?: boolean
  tone?: 'default' | 'warn' | 'info'
}) {
  const [open, setOpen] = useState(controlled ?? false)
  useEffect(() => {
    if (controlled !== undefined) setOpen(controlled)
  }, [controlled])

  const toneCls =
    tone === 'warn'
      ? 'text-amber-700 dark:text-amber-400'
      : tone === 'info'
        ? 'text-accent-700 dark:text-accent-300'
        : 'text-ink-600 dark:text-ink-300'

  return (
    <div className="border-t border-ink-100 dark:border-ink-800">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 py-2.5 text-left text-sm font-semibold hover:text-ink-900 dark:hover:text-white"
      >
        <IconChevron
          className={`shrink-0 text-ink-400 transition-transform ${open ? 'rotate-90' : ''}`}
        />
        <span className={toneCls}>{title}</span>
        {count !== undefined && (
          <span className="chip bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400">{count}</span>
        )}
      </button>
      {open && <div className="animate-fade-in pb-4 pl-6">{children}</div>}
    </div>
  )
}
