import { useMemo } from 'react'
import { GROUPS, TRACKS } from '../data/tracks'
import { ALL_QUESTIONS } from '../data/questions'
import { useProgress } from '../lib/progress'
import { navigate, useRoute } from '../lib/router'
import { IconChevron } from './Icons'
import { StatBar } from './StatBar'

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { segments } = useRoute()
  const { marks } = useProgress()
  const activeGroup = segments[0] === 'study' ? segments[1] : undefined

  const stats = useMemo(() => {
    const byGroup = new Map<string, { total: number; known: number; unsure: number }>()
    for (const q of ALL_QUESTIONS) {
      const s = byGroup.get(q.groupId) ?? { total: 0, known: 0, unsure: 0 }
      s.total++
      if (marks[q.id] === 'known') s.known++
      else if (marks[q.id] === 'unsure') s.unsure++
      byGroup.set(q.groupId, s)
    }
    return byGroup
  }, [marks])

  const go = (path: string) => {
    navigate(path)
    onNavigate?.()
  }

  return (
    <nav className="thin-scroll h-full overflow-y-auto px-3 pb-16 pt-4" aria-label="Chủ đề">
      {TRACKS.map((track) => {
        const groups = GROUPS.filter((g) => g.trackId === track.id)
        const totals = groups.reduce(
          (acc, g) => {
            const s = stats.get(g.id)
            return {
              total: acc.total + (s?.total ?? 0),
              known: acc.known + (s?.known ?? 0),
              unsure: acc.unsure + (s?.unsure ?? 0),
            }
          },
          { total: 0, known: 0, unsure: 0 },
        )
        const hasActive = groups.some((g) => g.id === activeGroup)

        return (
          <details key={track.id} open={hasActive || track.id === 'android'} className="group mb-1.5">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-ink-800 hover:bg-ink-50 dark:text-ink-100 dark:hover:bg-ink-800/60">
              <IconChevron className="shrink-0 text-ink-400 transition-transform group-open:rotate-90" />
              <span className="shrink-0">{track.emoji}</span>
              <span className="min-w-0 flex-1 truncate">{track.title}</span>
              <span className="shrink-0 font-mono text-[11px] font-normal tabular-nums text-ink-400">
                {totals.known}/{totals.total}
              </span>
            </summary>

            <div className="mb-2 mt-1 px-2 pl-8">
              <StatBar known={totals.known} unsure={totals.unsure} total={totals.total} />
            </div>

            <ul className="mb-2 space-y-px">
              {groups.map((g) => {
                const s = stats.get(g.id) ?? { total: 0, known: 0, unsure: 0 }
                const isActive = g.id === activeGroup
                return (
                  <li key={g.id}>
                    <button
                      type="button"
                      onClick={() => go(`/study/${g.id}`)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`flex w-full items-center gap-2 rounded-lg py-1.5 pl-8 pr-2 text-left text-[13px] transition ${
                        isActive
                          ? 'bg-accent-50 font-medium text-accent-800 dark:bg-accent-900/30 dark:text-accent-200'
                          : 'text-ink-600 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800/60'
                      }`}
                    >
                      <span className="min-w-0 flex-1 truncate">{g.title}</span>
                      {s.total > 0 && (
                        <span className="shrink-0 font-mono text-[11px] tabular-nums text-ink-400">
                          {s.known}/{s.total}
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </details>
        )
      })}
    </nav>
  )
}
