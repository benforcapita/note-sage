import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Sidebar } from './components/Sidebar';
import { NoteEditor } from './components/NoteEditor';
import { ChatPanel } from './components/ChatPanel';
import { OfflineIndicator } from './components/OfflineIndicator';
import { WorkspaceManager } from './components/WorkspaceManager';
import { PWAPrompts } from './components/PWAPrompts';
import { ThemeProvider } from './contexts/ThemeContext';
import { Note, ChatMessage } from './types';
import { workspaceManager, WorkspaceData } from './utils/workspace';
import { storage } from './utils/storage';

function AppContent() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentWorkspaceFile, setCurrentWorkspaceFile] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load data on app start - try workspace first, then fall back to localStorage
  useEffect(() => {
    const workspaceData = workspaceManager.getData();
    
    if (workspaceData.notes.length > 0 || workspaceData.chatMessages.length > 0) {
      // Use workspace data if available
      setNotes(workspaceData.notes);
      setChatMessages(workspaceData.chatMessages);
      setCurrentWorkspaceFile(workspaceManager.getCurrentWorkspaceFile());
    } else {
      // Fall back to localStorage for backwards compatibility
      const savedNotes = storage.notes.get();
      const savedMessages = storage.chat.get();
      
      setNotes(savedNotes);
      setChatMessages(savedMessages);
      
      // If we have localStorage data, update the workspace
      if (savedNotes.length > 0 || savedMessages.length > 0) {
        workspaceManager.updateNotes(savedNotes);
        workspaceManager.updateChatMessages(savedMessages);
      }
    }
    
    // Select the first note if available
    const currentNotes = workspaceData.notes.length > 0 ? workspaceData.notes : storage.notes.get();
    if (currentNotes.length > 0) {
      setSelectedNoteId(currentNotes[0].id);
    }
  }, []);

  // Update workspace whenever notes change
  useEffect(() => {
    workspaceManager.updateNotes(notes);
    // Also keep localStorage updated for backwards compatibility
    storage.notes.set(notes);
  }, [notes]);

  // Update workspace whenever chat messages change
  useEffect(() => {
    workspaceManager.updateChatMessages(chatMessages);
    // Also keep localStorage updated for backwards compatibility
    storage.chat.set(chatMessages);
  }, [chatMessages]);

  const handleWorkspaceLoad = (data: WorkspaceData) => {
    setNotes(data.notes);
    setChatMessages(data.chatMessages);
    setCurrentWorkspaceFile(workspaceManager.getCurrentWorkspaceFile());
    setErrorMessage(null);
    
    // Select the first note if available
    if (data.notes.length > 0) {
      setSelectedNoteId(data.notes[0].id);
    } else {
      setSelectedNoteId(null);
    }
  };

  const handleError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  const handleCreateNote = () => {
    const newNote: Note = {
      id: uuidv4(),
      title: 'New Chat Note',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: []
    };
    
    setNotes([newNote, ...notes]);
    setSelectedNoteId(newNote.id);
    setIsSidebarOpen(false);
  };

  const handleSaveNote = (updatedNote: Note) => {
    setNotes(notes.map(note => 
      note.id === updatedNote.id ? updatedNote : note
    ));
  };

  const handleDeleteNote = (noteId: string) => {
    if (window.confirm('Are you sure you want to delete this chat note?')) {
      setNotes(notes.filter(note => note.id !== noteId));
      if (selectedNoteId === noteId) {
        const remainingNotes = notes.filter(note => note.id !== noteId);
        setSelectedNoteId(remainingNotes.length > 0 ? remainingNotes[0].id : null);
      }
    }
  };

  const handleSendMessage = (message: ChatMessage) => {
    setChatMessages([...chatMessages, message]);
  };

  const selectedNote = notes.find(note => note.id === selectedNoteId) || null;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 font-['Inter'] transition-colors duration-200">
      <OfflineIndicator />
      
      {/* Error Message */}
      {errorMessage && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
            {errorMessage}
          </div>
        </div>
      )}

      {/* Workspace Manager */}
      <div className="fixed top-4 right-4 z-40">
        <WorkspaceManager
          onWorkspaceLoad={handleWorkspaceLoad}
          onError={handleError}
          currentWorkspaceFile={currentWorkspaceFile}
        />
      </div>

      {/* Sidebar */}
      <Sidebar
        notes={notes}
        selectedNoteId={selectedNoteId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNoteSelect={setSelectedNoteId}
        onCreateNote={handleCreateNote}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Content */}
      <div className="flex-1 flex">
        <NoteEditor
          note={selectedNote}
          onSave={handleSaveNote}
          onDelete={handleDeleteNote}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onToggleChat={() => setIsChatOpen(!isChatOpen)}
          isChatOpen={isChatOpen}
        />

        {/* Chat Panel */}
        <ChatPanel
          messages={chatMessages}
          notes={notes}
          onSendMessage={handleSendMessage}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
      <PWAPrompts />
    </ThemeProvider>
  );
}

export default App;