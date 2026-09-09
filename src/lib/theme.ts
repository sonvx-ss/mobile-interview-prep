import { useEffect, useState } from 'react'
import { useLocalState } from './useLocalState'

export type Theme = 'light' | 'dark' | 'system'

const prefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches

export function useTheme() {
  const [theme, setTheme] = useLocalState<Theme>('theme', 'light')
  const [systemDark, setSystemDark] = useState(prefersDark)

  const isDark = theme === 'dark' || (theme === 'system' && systemDark)

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', isDark ? 'dark' : 'light')
    root.classList.toggle('dark', isDark)
  }, [isDark])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return { theme, setTheme, isDark } as const
}
