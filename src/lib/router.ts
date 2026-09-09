import { useEffect, useState } from 'react'

export function currentPath(): string {
  const h = window.location.hash.replace(/^#/, '')
  return h === '' ? '/' : h
}

export function navigate(path: string, opts: { replace?: boolean } = {}) {
  const target = `#${path}`
  if (opts.replace) {
    window.history.replaceState(null, '', target)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  } else {
    window.location.hash = path
  }
}

export function useRoute() {
  const [path, setPath] = useState(currentPath)

  useEffect(() => {
    const onChange = () => setPath(currentPath())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  useEffect(() => {
    // Đưa về đầu trang khi đổi route (trừ khi có anchor)
    if (!path.includes('#')) window.scrollTo({ top: 0 })
  }, [path])

  const segments = path.split('?')[0].split('/').filter(Boolean)
  const query = new URLSearchParams(path.split('?')[1] ?? '')

  return { path, segments, query }
}
