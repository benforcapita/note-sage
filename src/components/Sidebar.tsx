import React from 'react';
import { Search, Plus, FileText, Tag, Calendar, X, Menu, MessageSquare } from 'lucide-react';
import { Note } from '../types';
import { ThemeToggle } from './ThemeToggle';
import { PWAInstallButton } from './PWAInstallButton';

interface SidebarProps {
  notes: Note[];
  selectedNoteId: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNoteSelect: (noteId: string) => void;
  onCreateNote: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({
  notes,
  selectedNoteId,
  searchQuery,
  onSearchChange,
  onNoteSelect,
  onCreateNote,
  isOpen,
  onToggle
}: SidebarProps) {
  const filteredNotes = notes.filter(note => {
    const searchLower = searchQuery.toLowerCase();
    return (
      note.title.toLowerCase().includes(searchLower) ||
      note.messages.some(msg => msg.content.toLowerCase().includes(searchLower)) ||
      note.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getPreviewText = (note: Note) => {
    if (note.messages.length === 0) return 'No messages yet...';
    const lastMessage = note.messages[note.messages.length - 1];
    return lastMessage.content.length > 100 
      ? lastMessage.content.substring(0, 100) + '...'
      : lastMessage.content;
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl 
        border-r border-gray-200/50 dark:border-gray-700/50 shadow-xl z-50 
        transform transition-all duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">NoteSage</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Chat-Style Notes</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <PWAInstallButton />
            <ThemeToggle />
            <button
              onClick={onToggle}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors lg:hidden"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
        </div>

        {/* Create Note Button */}
        <div className="px-4 mb-4">
          <button
            onClick={onCreateNote}
            className="w-full flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">New Chat Note</span>
          </button>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No notes found</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Create your first chat note to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredNotes.map(note => (
                <div
                  key={note.id}
                  onClick={() => onNoteSelect(note.id)}
                  className={`
                    p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md
                    ${selectedNoteId === note.id 
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 shadow-md' 
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white line-clamp-1 flex-1">
                      {note.title || 'Untitled Chat'}
                    </h3>
                    <div className="flex items-center space-x-1 ml-2">
                      <MessageSquare className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {note.messages.length}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                    {getPreviewText(note)}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(note.updatedAt)}
                      </span>
                    </div>
                    {note.tags.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <Tag className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {note.tags.length}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}