import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Sidebar } from './components/Sidebar';
import { NoteEditor } from './components/NoteEditor';
import { ChatPanel } from './components/ChatPanel';
import { ThemeProvider } from './contexts/ThemeContext';
import { Note, ChatMessage } from './types';
import { storage } from './utils/storage';

function AppContent() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Load data from localStorage on app start
  useEffect(() => {
    const savedNotes = storage.notes.get();
    const savedMessages = storage.chat.get();
    
    setNotes(savedNotes);
    setChatMessages(savedMessages);
    
    // Select the first note if available
    if (savedNotes.length > 0) {
      setSelectedNoteId(savedNotes[0].id);
    }
  }, []);

  // Save notes to localStorage whenever notes change
  useEffect(() => {
    storage.notes.set(notes);
  }, [notes]);

  // Save chat messages to localStorage whenever messages change
  useEffect(() => {
    storage.chat.set(chatMessages);
  }, [chatMessages]);

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
    </ThemeProvider>
  );
}

export default App;