const PREFIX = 'pokeivcalc'

/** localStorage falha em modo privado e em contextos sem storage — nunca deixe quebrar a UI. */
function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* sem persistência: o app continua funcionando, só não lembra */
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    /* idem */
  }
}

export function readJson<T>(namespace: string, key: string): T | null {
  const raw = safeGet(`${PREFIX}:${namespace}:${key}`)
  if (raw === null) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function writeJson(namespace: string, key: string, value: unknown): void {
  safeSet(`${PREFIX}:${namespace}:${key}`, JSON.stringify(value))
}

export function removeJson(namespace: string, key: string): void {
  safeRemove(`${PREFIX}:${namespace}:${key}`)
}
