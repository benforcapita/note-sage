import { describe, expect, it } from 'vitest';
import { llmService } from '../src/utils/llm';
import type { Note } from '../src/types';
const notes: Note[] = [
  { id: 'old', title: 'Old', tags: [], messages: [], createdAt: new Date('2025-01-01'), updatedAt: new Date('2025-01-01') },
  { id: 'new', title: 'Weekend plans', tags: ['travel'], messages: [{ id: 'm1', type: 'message', content: 'Book the train to Haifa', timestamp: new Date('2025-08-02') }], createdAt: new Date('2025-08-01'), updatedAt: new Date('2025-08-02') },
];
describe('truthful local helper', () => {
  it('sorts recent notes by actual update time', async () => {
    const result = await llmService.chatWithNotes('recent notes', notes);
    expect(result.indexOf('Weekend plans')).toBeLessThan(result.indexOf('Old'));
  });
  it('finds real matching note text and never fabricates a semantic answer', async () => {
    const result = await llmService.chatWithNotes('find train', notes);
    expect(result).toContain('Weekend plans');
    expect(result).toContain('Book the train to Haifa');
    expect(await llmService.chatWithNotes('find submarine', notes)).toMatch(/no.*match/i);
  });
  it('provides grounded counts and correct export instructions', async () => {
    expect(await llmService.chatWithNotes('how many messages', notes)).toContain('2 notes');
    expect(await llmService.chatWithNotes('export', notes)).toContain('Export');
    expect(await llmService.chatWithNotes('export', notes)).not.toContain('note editor');
  });
  it('describes limits truthfully and handles an empty workspace', async () => {
    expect(await llmService.chatWithNotes('invent a vacation', notes)).toMatch(/local|keyword/i);
    expect(await llmService.generateSummary([])).not.toMatch(/NaN|Recent weeks|Various topics/);
  });
});
