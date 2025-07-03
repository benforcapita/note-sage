import { Note, ChatMessage, NoteMessage } from '../types';

interface StoredNote {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  messages: StoredNoteMessage[];
}

interface StoredNoteMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface StoredChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const storage = {
  notes: {
    get: (): Note[] => {
      try {
        const notes = localStorage.getItem('notes');
        return notes ? JSON.parse(notes).map((note: StoredNote) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
          messages: (note.messages || []).map((msg: StoredNoteMessage): NoteMessage => ({
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
        return messages ? JSON.parse(messages).map((msg: StoredChatMessage): ChatMessage => ({
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