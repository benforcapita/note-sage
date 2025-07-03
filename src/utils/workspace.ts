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
  }

  // Update chat messages in workspace
  updateChatMessages(messages: ChatMessage[]) {
    this.data.chatMessages = messages;
    this.data.lastUpdated = new Date().toISOString();
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
    return this.data;
  }

  // Auto-save functionality
  async autoSave(): Promise<void> {
    if (this.currentWorkspaceFile) {
      try {
        const blob = await this.saveWorkspace();
        // Create a download link and trigger it for auto-save
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.currentWorkspaceFile;
        // Note: Browsers prevent automatic downloads for security reasons
        // We'll implement this as a manual save for now
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }
  }
}

export const workspaceManager = new WorkspaceManager();