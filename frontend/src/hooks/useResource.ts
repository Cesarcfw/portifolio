import { useCallback, useEffect, useRef, useState } from 'react'

// Each section owns its request: an optional service cannot blank the page.
export function useResource<T>(load: () => Promise<T>, initial: T) {
  const [state, setState] = useState({ data: initial, loading: true, error: false })
  const generation = useRef(0)
  const fallback = useRef(initial)
  const cancel = useCallback(() => { generation.current++ }, [])
  const retry = useCallback(async () => {
    const request = ++generation.current
    setState(current => ({ ...current, loading: true, error: false }))
    try {
      const data = await load()
      if (data == null && fallback.current != null) throw new Error('Empty API response')
      if (Array.isArray(fallback.current) && !Array.isArray(data)) throw new Error('Invalid API list')
      if (request === generation.current) setState({ data, loading: false, error: false })
    } catch {
      if (request === generation.current) setState(current => ({ ...current, loading: false, error: true }))
    }
  }, [load])
  useEffect(() => {
    let mounted = true
    queueMicrotask(() => { if (mounted) void retry() })
    window.addEventListener('portfolio:refresh', retry)
    return () => {
      mounted = false
      cancel()
      window.removeEventListener('portfolio:refresh', retry)
    }
  }, [retry, cancel])
  return { ...state, retry }
}
