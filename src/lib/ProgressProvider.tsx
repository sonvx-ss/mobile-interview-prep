import { useCallback, useMemo, type ReactNode } from 'react'
import { useLocalState } from './useLocalState'
import { ProgressContext, type Mark, type ProgressMap } from './progress'

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [marks, setMarks] = useLocalState<ProgressMap>('progress', {})
  const [bookmarks, setBookmarks] = useLocalState<string[]>('bookmarks', [])

  const setMark = useCallback(
    (id: string, mark: Mark | null) => {
      setMarks((prev) => {
        const next = { ...prev }
        if (mark == null) delete next[id]
        else next[id] = mark
        return next
      })
    },
    [setMarks],
  )

  const toggleBookmark = useCallback(
    (id: string) => {
      setBookmarks((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
    },
    [setBookmarks],
  )

  const clearAll = useCallback(() => {
    setMarks({})
    setBookmarks([])
  }, [setMarks, setBookmarks])

  const value = useMemo(
    () => ({ marks, setMark, bookmarks, toggleBookmark, clearAll }),
    [marks, setMark, bookmarks, toggleBookmark, clearAll],
  )

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}
