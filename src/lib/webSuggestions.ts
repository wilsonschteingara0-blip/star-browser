let counter = 0

interface YoutubeSuggestResponse {
  0: string
  1: Array<[string, number?]>
}

/**
 * Google's public suggest endpoint is JSONP-only, so we can ask it directly
 * from the page without any API key. If the network is unavailable we quietly
 * return nothing — the constellation still answers every search.
 */
export function fetchWebSuggestions(query: string): Promise<string[]> {
  const q = query.trim()
  if (q.length < 2) return Promise.resolve([])

  return new Promise((resolve) => {
    const callback = `__starSuggest${++counter}_${Date.now().toString(36)}`
    let settled = false
    const script = document.createElement('script')
    const cleanup = () => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      try {
        delete (window as unknown as Record<string, unknown>)[callback]
      } catch {
        /* noop */
      }
      script.remove()
      resolve([])
    }
    const timer = window.setTimeout(cleanup, 2400)

    ;(window as unknown as Record<string, unknown>)[callback] = (data: YoutubeSuggestResponse) => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      const list = Array.isArray(data?.[1])
        ? data[1].map((row) => (Array.isArray(row) ? String(row[0]) : '')).filter(Boolean)
        : []
      try {
        delete (window as unknown as Record<string, unknown>)[callback]
      } catch {
        /* noop */
      }
      script.remove()
      resolve(list.slice(0, 5))
    }

    script.src = `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(
      q,
    )}&callback=${callback}`
    script.async = true
    script.onerror = cleanup
    document.head.appendChild(script)
  })
}
