export interface NoteMessage {
  id: string;
  content: string;
  timestamp: Date;
  type: 'message';
}

export interface Note {
  id: string;
  title: string;
  messages: NoteMessage[];
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  draft?: string;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AppState {
  notes: Note[];
  selectedNoteId: string | null;
  searchQuery: string;
  chatMessages: ChatMessage[];
  theme: 'light' | 'dark';
  isChatOpen: boolean;
  isSidebarOpen: boolean;
}