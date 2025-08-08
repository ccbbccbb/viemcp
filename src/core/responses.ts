export function textResponse(text: string) {
  return { content: [{ type: 'text' as const, text }] }
}

export function jsonResponse(data: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(
          data,
          (_k, v) => (typeof v === 'bigint' ? v.toString() : v),
          2,
        ),
      },
    ],
  }
}

export function handleError(error: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: `Error: ${error instanceof Error ? error.message : String(error)}`,
      },
    ],
  }
}
