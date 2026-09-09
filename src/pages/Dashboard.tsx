import { useMemo } from 'react'
import { ALL_QUESTIONS } from '../data/questions'
import { GROUPS, TRACKS } from '../data/tracks'
import { LEVEL_LABEL, LEVELS } from '../data/types'
import { useProgress } from '../lib/progress'
import { navigate } from '../lib/router'
import { ProgressRing } from '../components/ProgressRing'
import { StatBar } from '../components/StatBar'
import { QuestionCard } from '../components/QuestionCard'
import { IconPlay, IconRefresh, IconStar } from '../components/Icons'

export function Dashboard() {
  const { marks, bookmarks, clearAll } = useProgress()

  const stats = useMemo(() => {
    const total = ALL_QUESTIONS.length
    let known = 0
    let unsure = 0
    for (const q of ALL_QUESTIONS) {
      if (marks[q.id] === 'known') known++
      else if (marks[q.id] === 'unsure') unsure++
    }

    const perTrack = TRACKS.map((t) => {
      const groupIds = GROUPS.filter((g) => g.trackId === t.id).map((g) => g.id)
      const qs = ALL_QUESTIONS.filter((q) => groupIds.includes(q.groupId))
      return {
        track: t,
        total: qs.length,
        known: qs.filter((q) => marks[q.id] === 'known').length,
        unsure: qs.filter((q) => marks[q.id] === 'unsure').length,
        firstGroup: groupIds[0],
      }
    })

    const perLevel = LEVELS.map((l) => {
      const qs = ALL_QUESTIONS.filter((q) => q.levels.includes(l))
      return {
        level: l,
        total: qs.length,
        known: qs.filter((q) => marks[q.id] === 'known').length,
      }
    })

    return { total, known, unsure, perTrack, perLevel }
  }, [marks])

  const weakest = useMemo(
    () =>
      ALL_QUESTIONS.filter((q) => marks[q.id] === 'unsure').slice(0, 3),
    [marks],
  )

  const starred = useMemo(
    () => ALL_QUESTIONS.filter((q) => bookmarks.includes(q.id)),
    [bookmarks],
  )

  const touched = stats.known + stats.unsure

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl dark:text-white">
          Ôn luyện phỏng vấn Mobile
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-500 dark:text-ink-400">
          {ALL_QUESTIONS.length} câu hỏi Android &amp; Flutter mọi level, mỗi câu có{' '}
          <strong className="font-semibold text-ink-700 dark:text-ink-200">
            câu trả lời chốt nhanh
          </strong>{' '}
          để nói ngay khi phỏng vấn, phần giải thích sâu, code mẫu, bẫy thường gặp và câu hỏi
          interviewer sẽ đào tiếp.
        </p>
      </header>

      {/* Hàng hành động chính */}
      <div className="mb-8 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => navigate('/mock')}
          className="card group flex items-center gap-4 p-4 text-left transition hover:border-accent-300 hover:shadow-sm dark:hover:border-accent-700"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300">
            <IconPlay width={18} height={18} />
          </span>
          <span className="min-w-0">
            <span className="block font-semibold text-ink-900 dark:text-white">
              Bắt đầu mock interview
            </span>
            <span className="block text-sm text-ink-500 dark:text-ink-400">
              Bộ đề theo level, có timer từng câu
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => navigate(weakest.length ? `/study/${weakest[0].groupId}?q=${weakest[0].id}` : '/study')}
          className="card group flex items-center gap-4 p-4 text-left transition hover:border-accent-300 hover:shadow-sm dark:hover:border-accent-700"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            <IconRefresh width={18} height={18} />
          </span>
          <span className="min-w-0">
            <span className="block font-semibold text-ink-900 dark:text-white">
              {weakest.length ? 'Ôn lại câu chưa chắc' : 'Ôn tập theo chủ đề'}
            </span>
            <span className="block text-sm text-ink-500 dark:text-ink-400">
              {weakest.length
                ? `${ALL_QUESTIONS.filter((q) => marks[q.id] === 'unsure').length} câu bạn đánh dấu chưa chắc`
                : 'Duyệt cây chủ đề, đánh dấu tiến độ'}
            </span>
          </span>
        </button>
      </div>

      {/* Tiến độ tổng */}
      <section className="card mb-8 p-5">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
          <ProgressRing value={stats.total ? stats.known / stats.total : 0} size={64} stroke={6} />
          <div className="min-w-[180px] flex-1">
            <p className="text-sm font-semibold text-ink-900 dark:text-white">Tiến độ của bạn</p>
            <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">
              <strong className="font-semibold text-emerald-600 dark:text-emerald-400">
                {stats.known}
              </strong>{' '}
              đã chắc ·{' '}
              <strong className="font-semibold text-amber-600 dark:text-amber-400">
                {stats.unsure}
              </strong>{' '}
              chưa chắc ·{' '}
              <strong className="font-semibold">{stats.total - touched}</strong> chưa xem
            </p>
            <div className="mt-2.5">
              <StatBar known={stats.known} unsure={stats.unsure} total={stats.total} />
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            {stats.perLevel.map((l) => (
              <div key={l.level} className="min-w-[64px]">
                <p className="text-[11px] font-medium uppercase tracking-wide text-ink-400">
                  {LEVEL_LABEL[l.level]}
                </p>
                <p className="font-mono text-sm tabular-nums text-ink-700 dark:text-ink-200">
                  {l.known}/{l.total}
                </p>
              </div>
            ))}
          </div>
        </div>
        {touched > 0 && (
          <button
            type="button"
            onClick={() => {
              if (confirm('Xoá toàn bộ tiến độ và đánh dấu? Không thể hoàn tác.')) clearAll()
            }}
            className="mt-4 text-xs text-ink-400 underline decoration-dotted hover:text-rose-600"
          >
            Xoá toàn bộ tiến độ
          </button>
        )}
      </section>

      {/* Theo track */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
          Chủ đề
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {stats.perTrack.map((t) => (
            <button
              key={t.track.id}
              type="button"
              onClick={() => navigate(`/study/${t.firstGroup}`)}
              className="card p-4 text-left transition hover:border-accent-300 hover:shadow-sm dark:hover:border-accent-700"
            >
              <div className="flex items-start gap-3">
                <span className="text-xl leading-6">{t.track.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-semibold text-ink-900 dark:text-white">{t.track.title}</h3>
                    <span className="shrink-0 font-mono text-xs tabular-nums text-ink-400">
                      {t.known}/{t.total}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-500 dark:text-ink-400">
                    {t.track.blurb}
                  </p>
                  <div className="mt-2.5">
                    <StatBar known={t.known} unsure={t.unsure} total={t.total} />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Đã đánh dấu */}
      {starred.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
            <IconStar filled width={14} height={14} className="text-amber-500" />
            Đã đánh dấu ({starred.length})
          </h2>
          <div className="space-y-3">
            {starred.slice(0, 5).map((q) => (
              <QuestionCard key={q.id} question={q} showBreadcrumb />
            ))}
          </div>
        </section>
      )}

      <footer className="border-t border-ink-100 pt-6 text-[13px] leading-relaxed text-ink-400 dark:border-ink-800">
        <p>
          Tiến độ và ghi chú được lưu trong <strong>localStorage của trình duyệt này</strong> — không
          gửi đi đâu, nhưng cũng không đồng bộ sang máy khác. Nhấn{' '}
          <kbd className="rounded border border-ink-200 px-1 font-mono text-[11px] dark:border-ink-700">
            ⌘K
          </kbd>{' '}
          hoặc{' '}
          <kbd className="rounded border border-ink-200 px-1 font-mono text-[11px] dark:border-ink-700">
            /
          </kbd>{' '}
          để tìm nhanh câu hỏi.
        </p>
      </footer>
    </div>
  )
}
