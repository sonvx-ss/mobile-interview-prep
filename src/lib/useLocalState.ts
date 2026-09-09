import { useCallback, useEffect, useState } from 'react'
import { load, save } from './storage'

/** useState nhưng đồng bộ với localStorage, và nghe thay đổi từ tab khác. */
export function useLocalState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => load(key, initial))

  useEffect(() => {
    save(key, value)
  }, [key, value])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === `mip:v1:${key}` && e.newValue) {
        try {
          setValue(JSON.parse(e.newValue) as T)
        } catch {
          /* noop */
        }
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [key])

  const reset = useCallback(() => setValue(initial), [initial])

  return [value, setValue, reset] as const
}
