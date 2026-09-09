import { useEffect, useState } from 'react'
import type { Question } from '../data/types'
import { Markdown } from './Markdown'
import { CodeBlock } from './CodeBlock'
import { Disclosure } from './Disclosure'
import { LevelChips } from './LevelChips'
import { MarkButtons } from './MarkButtons'
import { IconStar } from './Icons'
import { CodeTitle } from './CodeTitle'
import { useProgress, MARK_DOT } from '../lib/progress'
import { groupById, trackById } from '../data/tracks'

interface Props {
  question: Question
  index?: number
  /** mở sẵn phần giải thích sâu */
  expandAll?: boolean
  /** chế độ mock: ẩn toàn bộ đáp án đến khi bấm hiện */
  quizMode?: boolean
  showBreadcrumb?: boolean
}

export function QuestionCard({
  question: q,
  index,
  expandAll = false,
  quizMode = false,
  showBreadcrumb = false,
}: Props) {
  const { marks, bookmarks, toggleBookmark } = useProgress()
  const [revealed, setRevealed] = useState(!quizMode)
  useEffect(() => setRevealed(!quizMode), [quizMode, q.id])

  const mark = marks[q.id] ?? 'todo'
  const starred = bookmarks.includes(q.id)
  const group = groupById(q.groupId)
  const track = group ? trackById(group.trackId) : undefined

  return (
    <article
      id={q.id}
      className="card scroll-mt-24 p-4 sm:p-5"
      aria-label={q.title}
    >
      <header className="flex flex-wrap items-start gap-x-3 gap-y-2">
        <span
          className={`mt-2 h-2 w-2 shrink-0 rounded-full ${MARK_DOT[mark]}`}
          title={mark}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          {showBreadcrumb && track && group && (
            <p className="mb-1 text-xs text-ink-400">
              {track.emoji} {track.title} · {group.title}
            </p>
          )}
          <h3 className="text-[17px] font-semibold leading-6 text-ink-900 dark:text-white">
            {index !== undefined && (
              <span className="mr-1.5 font-mono text-sm text-ink-400">{index}.</span>
            )}
            <CodeTitle text={q.title} />
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <LevelChips levels={q.levels} />
            {q.tags?.map((t) => (
              <span key={t} className="chip bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400">
                #{t}
              </span>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => toggleBookmark(q.id)}
          title={starred ? 'Bỏ đánh dấu' : 'Đánh dấu để ôn lại'}
          aria-pressed={starred}
          className={`no-print rounded-md p-1.5 transition ${
            starred
              ? 'text-amber-500'
              : 'text-ink-300 hover:text-ink-500 dark:text-ink-600 dark:hover:text-ink-400'
          }`}
        >
          <IconStar filled={starred} width={18} height={18} />
        </button>
      </header>

      {!revealed ? (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="btn mt-4 w-full justify-center py-2.5"
        >
          Hiện đáp án mẫu
        </button>
      ) : (
        <div className="mt-4">
          <div className="rounded-lg border-l-[3px] border-accent-500 bg-accent-50/60 px-3.5 py-3 dark:bg-accent-900/15">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-accent-700 dark:text-accent-300">
              Chốt nhanh — nói đúng ý này là đủ điểm
            </p>
            <Markdown>{q.short}</Markdown>
          </div>

          <div className="mt-3">
            {q.deep && (
              <Disclosure title="Giải thích sâu" open={expandAll || undefined}>
                <Markdown>{q.deep}</Markdown>
              </Disclosure>
            )}
            {q.code && q.code.length > 0 && (
              <Disclosure title="Code" count={q.code.length} open={expandAll || undefined}>
                <div className="space-y-4">
                  {q.code.map((c, i) => (
                    <CodeBlock key={i} sample={c} />
                  ))}
                </div>
              </Disclosure>
            )}
            {q.pitfalls && q.pitfalls.length > 0 && (
              <Disclosure
                title="Bẫy thường gặp"
                count={q.pitfalls.length}
                tone="warn"
                open={expandAll || undefined}
              >
                <ul className="prose-answer list-disc space-y-1.5 pl-5">
                  {q.pitfalls.map((p, i) => (
                    <li key={i}>
                      <Markdown>{p}</Markdown>
                    </li>
                  ))}
                </ul>
              </Disclosure>
            )}
            {q.followUps && q.followUps.length > 0 && (
              <Disclosure
                title="Interviewer sẽ đào tiếp"
                count={q.followUps.length}
                tone="info"
                open={expandAll || undefined}
              >
                <ul className="prose-answer list-disc space-y-1.5 pl-5">
                  {q.followUps.map((f, i) => (
                    <li key={i}>
                      <Markdown>{f}</Markdown>
                    </li>
                  ))}
                </ul>
              </Disclosure>
            )}
          </div>

          <footer className="no-print mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-ink-100 pt-3 dark:border-ink-800">
            <span className="text-xs text-ink-400">Bạn tự đánh giá câu này:</span>
            <MarkButtons id={q.id} />
          </footer>
        </div>
      )}
    </article>
  )
}
