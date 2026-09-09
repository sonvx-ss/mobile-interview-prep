import { createContext, useContext } from 'react'

export type Mark = 'known' | 'unsure' | 'todo'

export const MARK_LABEL: Record<Mark, string> = {
  known: 'Đã chắc',
  unsure: 'Chưa chắc',
  todo: 'Cần học',
}

export const MARK_CLASS: Record<Mark, string> = {
  known: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  unsure: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  todo: 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300',
}

export const MARK_DOT: Record<Mark, string> = {
  known: 'bg-emerald-500',
  unsure: 'bg-amber-500',
  todo: 'bg-ink-300 dark:bg-ink-600',
}

export interface ProgressMap {
  [questionId: string]: Mark
}

export interface ProgressApi {
  marks: ProgressMap
  setMark: (id: string, mark: Mark | null) => void
  bookmarks: string[]
  toggleBookmark: (id: string) => void
  clearAll: () => void
}

export const ProgressContext = createContext<ProgressApi | null>(null)

export function useProgress(): ProgressApi {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress phải nằm trong <ProgressProvider>')
  return ctx
}
