import { useEffect, useMemo, useRef, useState } from 'react'
import { searchQuestions } from '../data/selectors'
import { groupById, trackById } from '../data/tracks'
import { navigate } from '../lib/router'
import { LEVEL_CLASS, LEVEL_LABEL } from '../data/types'
import { IconSearch } from './Icons'
import { CodeTitle } from './CodeTitle'

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const results = useMemo(() => searchQuestions(query, 20), [query])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      // đợi một frame để input đã mount
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  useEffect(() => setActive(0), [query])

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [active])

  if (!open) return null

  const go = (index: number) => {
    const q = results[index]
    if (!q) return
    onClose()
    navigate(`/study/${q.groupId}?q=${q.id}`)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink-900/30 p-4 pt-[10vh] backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-xl border border-ink-200 bg-white shadow-2xl dark:border-ink-700 dark:bg-ink-900"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Tìm câu hỏi"
      >
        <div className="flex items-center gap-2.5 border-b border-ink-100 px-4 dark:border-ink-800">
          <IconSearch className="shrink-0 text-ink-400" width={18} height={18} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActive((a) => Math.min(a + 1, results.length - 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActive((a) => Math.max(a - 1, 0))
              } else if (e.key === 'Enter') {
                e.preventDefault()
                go(active)
              } else if (e.key === 'Escape') {
                onClose()
              }
            }}
            placeholder="Tìm câu hỏi… (vd: coroutine, isolate, memory leak)"
            className="w-full bg-transparent py-3.5 text-[15px] outline-none placeholder:text-ink-400"
          />
          <kbd className="hidden shrink-0 rounded border border-ink-200 px-1.5 py-0.5 font-mono text-[10px] text-ink-400 sm:block dark:border-ink-700">
            esc
          </kbd>
        </div>

        {query.trim().length >= 2 && (
          <ul ref={listRef} className="thin-scroll max-h-[55vh] overflow-y-auto py-1.5">
            {results.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-ink-400">
                Không tìm thấy câu nào khớp “{query}”.
              </li>
            )}
            {results.map((q, i) => {
              const group = groupById(q.groupId)
              const track = group ? trackById(group.trackId) : undefined
              return (
                <li key={q.id}>
                  <button
                    type="button"
                    data-active={i === active}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(i)}
                    className={`flex w-full items-start gap-3 px-4 py-2.5 text-left transition ${
                      i === active ? 'bg-accent-50 dark:bg-accent-900/25' : ''
                    }`}
                  >
                    <span className="mt-0.5 shrink-0 text-base leading-5">{track?.emoji}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink-900 dark:text-white">
                        <CodeTitle text={q.title} className="font-mono text-[0.9em] text-accent-700 dark:text-accent-300" />
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-ink-400">
                        {track?.title} · {group?.title}
                      </span>
                    </span>
                    <span className={`chip shrink-0 ${LEVEL_CLASS[q.levels[0]]}`}>
                      {LEVEL_LABEL[q.levels[0]]}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        {query.trim().length < 2 && (
          <p className="px-4 py-6 text-center text-sm text-ink-400">
            Gõ ít nhất 2 ký tự. Không cần dấu — “bo nho” cũng tìm ra “bộ nhớ”.
          </p>
        )}
      </div>
    </div>
  )
}
