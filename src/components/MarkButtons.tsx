import { MARK_LABEL, useProgress, type Mark } from '../lib/progress'

const ORDER: Mark[] = ['known', 'unsure', 'todo']

const ACTIVE: Record<Mark, string> = {
  known: 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  unsure: 'border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  todo: 'border-ink-400 bg-ink-100 text-ink-800 dark:bg-ink-700 dark:text-ink-100',
}

export function MarkButtons({ id, size = 'md' }: { id: string; size?: 'sm' | 'md' }) {
  const { marks, setMark } = useProgress()
  const current = marks[id]

  return (
    <div className="inline-flex flex-wrap gap-1" role="group" aria-label="Tự đánh giá">
      {ORDER.map((m) => {
        const active = current === m
        return (
          <button
            key={m}
            type="button"
            onClick={() => setMark(id, active ? null : m)}
            aria-pressed={active}
            className={`rounded-md border px-2 font-medium transition active:scale-[.97] ${
              size === 'sm' ? 'py-0.5 text-[11px]' : 'py-1 text-xs'
            } ${
              active
                ? ACTIVE[m]
                : 'border-ink-200 text-ink-500 hover:border-ink-300 hover:bg-ink-50 dark:border-ink-700 dark:text-ink-400 dark:hover:bg-ink-800'
            }`}
          >
            {MARK_LABEL[m]}
          </button>
        )
      })}
    </div>
  )
}
