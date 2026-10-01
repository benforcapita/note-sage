import { afterEach, describe, expect, it, vi } from 'vitest';
import { exportFile } from '../src/utils/files';
afterEach(() => vi.unstubAllGlobals());
describe('portable workspace export', () => {
  it('writes and closes a browser save handle before reporting saved', async () => {
    const write = vi.fn(), close = vi.fn();
    const picker = vi.fn().mockResolvedValue({ createWritable: async () => ({ write, close }) });
    vi.stubGlobal('window', { showSaveFilePicker: picker });
    const blob = new Blob(['{}']);
    expect(await exportFile(blob, 'test.json')).toBe('saved');
    expect(write).toHaveBeenCalledWith(blob);
    expect(close).toHaveBeenCalledOnce();
    expect(picker).toHaveBeenCalledOnce();
  });
  it('treats picker cancellation as a non-mutating, non-error result', async () => {
    vi.stubGlobal('window', { showSaveFilePicker: vi.fn().mockRejectedValue(new DOMException('cancel', 'AbortError')) });
    expect(await exportFile(new Blob(['{}']), 'test.json')).toBe('cancelled');
  });
  it('uses an ordinary JSON download when a save picker is unavailable', async () => {
    const link = { href: '', download: '', click: vi.fn(), remove: vi.fn() };
    vi.stubGlobal('window', {});
    vi.stubGlobal('document', { createElement: () => link, body: { append: vi.fn() } });
    expect(await exportFile(new Blob(['{}']), 'test.json')).toBe('downloaded');
    expect(link.download).toBe('test.json');
    expect(link.click).toHaveBeenCalledOnce();
    expect(link.remove).toHaveBeenCalledOnce();
  });
  it('reports real write failures rather than claiming the file was saved', async () => {
    vi.stubGlobal('window', { showSaveFilePicker: vi.fn().mockResolvedValue({ createWritable: async () => ({ write: () => { throw new Error('disk full'); }, close: vi.fn() }) }) });
    await expect(exportFile(new Blob(['{}']), 'test.json')).rejects.toThrow('disk full');
  });
});
