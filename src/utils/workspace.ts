import { Note, ChatMessage } from '../types';

export interface WorkspaceData {
  notes: Note[];
  chatMessages: ChatMessage[];
  version: string;
  lastUpdated: string;
}

class WorkspaceManager {
  private currentWorkspaceFile: string | null = null;
  private data: WorkspaceData = {
    notes: [],
    chatMessages: [],
    version: '1.0.0',
    lastUpdated: new Date().toISOString()
  };

  // Load workspace from file
  async loadWorkspace(file: File): Promise<WorkspaceData> {
    try {
      const text = await file.text();
      const parsedData = JSON.parse(text);
      
      // Convert date strings back to Date objects
      this.data = {
        ...parsedData,
        notes: parsedData.notes.map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
          messages: (note.messages || []).map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        })),
        chatMessages: parsedData.chatMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      };
      
      this.currentWorkspaceFile = file.name;
      return this.data;
    } catch (error) {
      console.error('Failed to load workspace:', error);
      throw new Error('Failed to load workspace file');
    }
  }

  // Save workspace to file
  async saveWorkspace(): Promise<Blob> {
    try {
      this.data.lastUpdated = new Date().toISOString();
      const dataString = JSON.stringify(this.data, null, 2);
      // Persist latest version to localStorage as well
      this.persist();
      return new Blob([dataString], { type: 'application/json' });
    } catch (error) {
      console.error('Failed to save workspace:', error);
      throw new Error('Failed to save workspace');
    }
  }

  // Update notes in workspace
  updateNotes(notes: Note[]) {
    this.data.notes = notes;
    this.data.lastUpdated = new Date().toISOString();
    this.persist();
  }

  // Update chat messages in workspace
  updateChatMessages(messages: ChatMessage[]) {
    this.data.chatMessages = messages;
    this.data.lastUpdated = new Date().toISOString();
    this.persist();
  }

  // Get current workspace data
  getData(): WorkspaceData {
    return this.data;
  }

  // Get current workspace file name
  getCurrentWorkspaceFile(): string | null {
    return this.currentWorkspaceFile;
  }

  // Create new workspace
  createNewWorkspace(): WorkspaceData {
    this.data = {
      notes: [],
      chatMessages: [],
      version: '1.0.0',
      lastUpdated: new Date().toISOString()
    };
    this.currentWorkspaceFile = null;
    this.persist();
    return this.data;
  }

  // Persist the entire workspace to localStorage
  private persist() {
    try {
      // We do not stringify Date objects directly; they are already plain ISO strings in this.data
      localStorage.setItem('workspaceData', JSON.stringify(this.data));
    } catch (error) {
      console.error('Failed to persist workspace to localStorage:', error);
    }
  }

  // Attempt to restore workspace from localStorage (executed at construction time)
  private restoreFromLocalStorage() {
    try {
      const raw = localStorage.getItem('workspaceData');
      if (!raw) return;

      const parsedData = JSON.parse(raw);

      this.data = {
        ...parsedData,
        notes: (parsedData.notes || []).map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
          messages: (note.messages || []).map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        })),
        chatMessages: (parsedData.chatMessages || []).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      };
    } catch (error) {
      console.error('Failed to restore workspace from localStorage:', error);
    }
  }

  constructor() {
    // Restore workspace (if any) as soon as the manager is instantiated.
    this.restoreFromLocalStorage();
  }

  // No-op autoSave maintained for API compatibility – now simply writes to localStorage
  async autoSave(): Promise<void> {
    this.persist();
  }
}

export const workspaceManager = new WorkspaceManager();