import { useEffect, useState, type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { CommandPalette } from './CommandPalette'
import { IconClose, IconMenu, IconMoon, IconSearch, IconSun } from './Icons'
import { navigate, useRoute } from '../lib/router'
import { useTheme } from '../lib/theme'
import { ALL_QUESTIONS } from '../data/questions'

const NAV = [
  { path: '/', label: 'Tổng quan' },
  { path: '/study', label: 'Ôn tập' },
  { path: '/mock', label: 'Mock interview' },
  { path: '/stories', label: 'STAR stories' },
]

export function Layout({ children }: { children: ReactNode }) {
  const { segments } = useRoute()
  const { theme, setTheme, isDark } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)

  const section = segments[0] ?? ''
  const showSidebar = section === 'study'

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const inField =
        e.target instanceof HTMLElement &&
        ['INPUT', 'TEXTAREA'].includes(e.target.tagName)

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setPaletteOpen(true)
      } else if (e.key === '/' && !inField) {
        e.preventDefault()
        setPaletteOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => setSidebarOpen(false), [segments.join('/')])

  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-30 border-b border-ink-200 bg-white/90 backdrop-blur dark:border-ink-800 dark:bg-ink-950/90">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-2 px-3 sm:px-5">
          {showSidebar && (
            <button
              type="button"
              className="btn shrink-0 px-2 lg:hidden"
              onClick={() => setSidebarOpen((o) => !o)}
              aria-label="Mở danh sách chủ đề"
            >
              {sidebarOpen ? <IconClose /> : <IconMenu />}
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate('/')}
            className="mr-1 flex shrink-0 items-center gap-2 rounded-lg px-1 py-1 text-left"
          >
            <span className="text-lg leading-none">📱</span>
            <span className="hidden text-sm font-semibold leading-tight sm:block">
              Mobile Interview Prep
              <span className="block text-[11px] font-normal text-ink-400">
                Android &amp; Flutter · {ALL_QUESTIONS.length} câu
              </span>
            </span>
          </button>

          <nav className="thin-scroll ml-auto flex min-w-0 items-center gap-0.5 overflow-x-auto sm:ml-2 sm:mr-auto">
            {NAV.map((item) => {
              const active =
                item.path === '/'
                  ? section === ''
                  : section === item.path.replace('/', '')
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigate(item.path)}
                  aria-current={active ? 'page' : undefined}
                  className={`shrink-0 rounded-lg px-2.5 py-1.5 text-sm font-medium transition ${
                    active
                      ? 'bg-ink-100 text-ink-900 dark:bg-ink-800 dark:text-white'
                      : 'text-ink-500 hover:bg-ink-50 hover:text-ink-800 dark:text-ink-400 dark:hover:bg-ink-800/60 dark:hover:text-ink-100'
                  }`}
                >
                  {item.label}
                </button>
              )
            })}
          </nav>

          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="btn shrink-0 gap-2 px-2 sm:px-3"
            aria-label="Tìm câu hỏi"
          >
            <IconSearch />
            <span className="hidden sm:inline">Tìm</span>
            <kbd className="hidden rounded border border-ink-200 px-1 font-mono text-[10px] text-ink-400 md:inline dark:border-ink-700">
              ⌘K
            </kbd>
          </button>

          <button
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="btn shrink-0 px-2"
            aria-label={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
            title={`Giao diện: ${theme}`}
          >
            {isDark ? <IconSun /> : <IconMoon />}
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px]">
        {showSidebar && (
          <>
            <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-[268px] shrink-0 border-r border-ink-200 lg:block dark:border-ink-800">
              <Sidebar />
            </aside>
            {sidebarOpen && (
              <div className="fixed inset-0 top-14 z-20 lg:hidden">
                <div
                  className="absolute inset-0 bg-ink-900/30"
                  onClick={() => setSidebarOpen(false)}
                  role="presentation"
                />
                <aside className="absolute left-0 top-0 h-full w-[280px] border-r border-ink-200 bg-white shadow-xl dark:border-ink-800 dark:bg-ink-950">
                  <Sidebar onNavigate={() => setSidebarOpen(false)} />
                </aside>
              </div>
            )}
          </>
        )}

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}
