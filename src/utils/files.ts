export function downloadFile(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  // Leave enough time for browsers to consume the blob, including mobile Safari.
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
export async function exportFile(blob: Blob, name: string): Promise<'saved' | 'downloaded' | 'cancelled'> {
  if (typeof window.showSaveFilePicker !== 'function') {
    downloadFile(blob, name);
    return 'downloaded';
  }
  try {
    const file = await window.showSaveFilePicker({ suggestedName: name, types: [{ description: 'NoteSage workspace', accept: { 'application/json': ['.json'] } }] });
    const stream = await file.createWritable();
    await stream.write(blob);
    await stream.close();
    return 'saved';
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') return 'cancelled';
    throw error;
  }
}
export function workspaceFilename(name: string): string {
  // Strip control characters as well as reserved filename punctuation.
  // eslint-disable-next-line no-control-regex
  return `${name.replace(/\.json$/i, '').replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').trim().slice(0, 100) || 'notesage-workspace'}.json`;
}
