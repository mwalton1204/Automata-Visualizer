let nextStateId = 0

export function resetRendererIds(): void {
  nextStateId = 0
}

export function makeStateId(): string {
  return `q${nextStateId++}`
}