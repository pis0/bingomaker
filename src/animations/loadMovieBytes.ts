import { parseMovieBytes } from './parseMovieBytes'
import type { MovieBytesData } from './parseMovieBytes'

const cache = new Map<string, MovieBytesData>()

/**
 * Loads and parses an AssukarMovieBytes binary file.
 * Results are cached by URL.
 */
export async function loadMovieBytes(url: string): Promise<MovieBytesData> {
  const cached = cache.get(url)
  if (cached) return cached

  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to load movie bytes: ${url} (${response.status})`)
  const buffer = await response.arrayBuffer()
  const data = await parseMovieBytes(buffer)
  cache.set(url, data)
  return data
}
