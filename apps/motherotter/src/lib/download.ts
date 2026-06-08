export function downloadBytes(bytes: Uint8Array, filename: string): void {
  const copy = new Uint8Array(bytes)
  const blob = new Blob([copy], { type: 'application/zip' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
