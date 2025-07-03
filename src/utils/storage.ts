import { Note, ChatMessage } from '../types';

export const storage = {
  notes: {
    get: (): Note[] => {
      try {
        const notes = localStorage.getItem('notes');
        return notes ? JSON.parse(notes).map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
          messages: (note.messages || []).map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        })) : [];
      } catch {
        return [];
      }
    },
    set: (notes: Note[]) => {
      try {
        localStorage.setItem('notes', JSON.stringify(notes));
      } catch (error) {
        console.error('Failed to save notes:', error);
      }
    }
  },
  chat: {
    get: (): ChatMessage[] => {
      try {
        const messages = localStorage.getItem('chatMessages');
        return messages ? JSON.parse(messages).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })) : [];
      } catch {
        return [];
      }
    },
    set: (messages: ChatMessage[]) => {
      try {
        localStorage.setItem('chatMessages', JSON.stringify(messages));
      } catch (error) {
        console.error('Failed to save chat messages:', error);
      }
    }
  }
};