import { useEffect, useMemo, useState } from 'react'
import { GROUPS, groupById, trackById } from '../data/tracks'
import { questionsOfGroup } from '../data/questions'
import { LEVELS, LEVEL_LABEL, type Level } from '../data/types'
import { useProgress, MARK_LABEL, type Mark } from '../lib/progress'
import { navigate, useRoute } from '../lib/router'
import { QuestionCard } from '../components/QuestionCard'
import { StatBar } from '../components/StatBar'
import { IconChevron } from '../components/Icons'

type MarkFilter = Mark | 'all'

export function Study() {
  const { segments, query } = useRoute()
  const groupId = segments[1] ?? GROUPS[0].id
  const focusId = query.get('q') ?? undefined

  const group = groupById(groupId)
  const track = group ? trackById(group.trackId) : undefined
  const questions = useMemo(() => questionsOfGroup(groupId), [groupId])
  const { marks } = useProgress()

  const [levelFilter, setLevelFilter] = useState<Level | 'all'>('all')
  const [markFilter, setMarkFilter] = useState<MarkFilter>('all')
  const [expandAll, setExpandAll] = useState(false)

  // Cuộn tới câu được chỉ định qua ?q=
  useEffect(() => {
    if (!focusId) return
    const el = document.getElementById(focusId)
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      el.classList.add('ring-2', 'ring-accent-400')
      const t = window.setTimeout(() => el.classList.remove('ring-2', 'ring-accent-400'), 1800)
      return () => window.clearTimeout(t)
    }
  }, [focusId, groupId])

  const visible = questions.filter((q) => {
    if (levelFilter !== 'all' && !q.levels.includes(levelFilter)) return false
    if (markFilter !== 'all' && (marks[q.id] ?? 'todo') !== markFilter) return false
    return true
  })

  const stats = {
    total: questions.length,
    known: questions.filter((q) => marks[q.id] === 'known').length,
    unsure: questions.filter((q) => marks[q.id] === 'unsure').length,
  }

  const siblings = group ? GROUPS.filter((g) => g.trackId === group.trackId) : []
  const idx = siblings.findIndex((g) => g.id === groupId)
  const prev = idx > 0 ? siblings[idx - 1] : undefined
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : undefined

  if (!group) {
    return (
      <div className="px-6 py-16 text-center text-ink-500">
        <p>Không tìm thấy chủ đề này.</p>
        <button type="button" className="btn mt-4" onClick={() => navigate('/study')}>
          Về danh sách chủ đề
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6">
        <p className="text-xs font-medium text-ink-400">
          {track?.emoji} {track?.title}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-900 dark:text-white">
          {group.title}
        </h1>
        {group.blurb && (
          <p className="mt-1.5 text-[15px] leading-relaxed text-ink-500 dark:text-ink-400">
            {group.blurb}
          </p>
        )}
        <div className="mt-4 flex items-center gap-3">
          <span className="shrink-0 font-mono text-xs tabular-nums text-ink-400">
            {stats.known}/{stats.total} đã chắc
          </span>
          <div className="min-w-0 flex-1">
            <StatBar known={stats.known} unsure={stats.unsure} total={stats.total} />
          </div>
        </div>
      </header>

      {/* Bộ lọc */}
      <div className="no-print sticky top-14 z-10 -mx-4 mb-5 flex flex-wrap items-center gap-2 border-b border-ink-100 bg-white/95 px-4 py-2.5 backdrop-blur sm:-mx-6 sm:px-6 dark:border-ink-800 dark:bg-ink-950/95">
        <div className="flex items-center gap-1" role="group" aria-label="Lọc theo level">
          <FilterChip active={levelFilter === 'all'} onClick={() => setLevelFilter('all')}>
            Mọi level
          </FilterChip>
          {LEVELS.map((l) => (
            <FilterChip key={l} active={levelFilter === l} onClick={() => setLevelFilter(l)}>
              {LEVEL_LABEL[l]}
            </FilterChip>
          ))}
        </div>

        <span className="mx-1 hidden h-4 w-px bg-ink-200 sm:block dark:bg-ink-700" />

        <div className="flex items-center gap-1" role="group" aria-label="Lọc theo tiến độ">
          <FilterChip active={markFilter === 'all'} onClick={() => setMarkFilter('all')}>
            Tất cả
          </FilterChip>
          {(['todo', 'unsure', 'known'] as Mark[]).map((m) => (
            <FilterChip key={m} active={markFilter === m} onClick={() => setMarkFilter(m)}>
              {MARK_LABEL[m]}
            </FilterChip>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setExpandAll((e) => !e)}
          className="ml-auto text-xs font-medium text-accent-600 hover:underline dark:text-accent-300"
        >
          {expandAll ? 'Thu gọn tất cả' : 'Mở tất cả'}
        </button>
      </div>

      {visible.length === 0 ? (
        <p className="card p-8 text-center text-sm text-ink-400">
          Không có câu nào khớp bộ lọc hiện tại.
        </p>
      ) : (
        <div className="space-y-4">
          {visible.map((q, i) => (
            <QuestionCard key={q.id} question={q} index={i + 1} expandAll={expandAll} />
          ))}
        </div>
      )}

      {/* Điều hướng nhóm */}
      <nav className="no-print mt-10 flex items-stretch gap-3 border-t border-ink-100 pt-6 dark:border-ink-800">
        {prev ? (
          <button
            type="button"
            onClick={() => navigate(`/study/${prev.id}`)}
            className="card flex-1 p-3 text-left transition hover:border-accent-300 dark:hover:border-accent-700"
          >
            <span className="flex items-center gap-1 text-xs text-ink-400">
              <IconChevron className="rotate-180" width={12} height={12} /> Trước
            </span>
            <span className="mt-0.5 block truncate text-sm font-medium text-ink-800 dark:text-ink-100">
              {prev.title}
            </span>
          </button>
        ) : (
          <span className="flex-1" />
        )}
        {next ? (
          <button
            type="button"
            onClick={() => navigate(`/study/${next.id}`)}
            className="card flex-1 p-3 text-right transition hover:border-accent-300 dark:hover:border-accent-700"
          >
            <span className="flex items-center justify-end gap-1 text-xs text-ink-400">
              Tiếp <IconChevron width={12} height={12} />
            </span>
            <span className="mt-0.5 block truncate text-sm font-medium text-ink-800 dark:text-ink-100">
              {next.title}
            </span>
          </button>
        ) : (
          <span className="flex-1" />
        )}
      </nav>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-md px-2 py-1 text-xs font-medium transition ${
        active
          ? 'bg-ink-800 text-white dark:bg-ink-100 dark:text-ink-900'
          : 'text-ink-500 hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-800'
      }`}
    >
      {children}
    </button>
  )
}
