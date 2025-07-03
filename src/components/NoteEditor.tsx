import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Tag, Calendar, Menu, MessageCircle, Download, Send } from 'lucide-react';
import { Note, NoteMessage } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { detectTextDirection, getTextDirectionClass } from '../utils/textDirection';

interface NoteEditorProps {
  note: Note | null;
  onSave: (note: Note) => void;
  onDelete: (noteId: string) => void;
  onToggleSidebar: () => void;
  onToggleChat: () => void;
  isChatOpen: boolean;
}

export function NoteEditor({ 
  note, 
  onSave, 
  onDelete, 
  onToggleSidebar,
  onToggleChat,
  isChatOpen
}: NoteEditorProps) {
  const [title, setTitle] = useState('');
  const [messages, setMessages] = useState<NoteMessage[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [currentMessage, setCurrentMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setMessages(note.messages || []);
      setTags(note.tags);
    } else {
      setTitle('');
      setMessages([]);
      setTags([]);
    }
  }, [note]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [currentMessage]);

  // Auto-save when title changes (after a delay to avoid excessive saves while typing)
  useEffect(() => {
    if (!note || title === note.title) return;
    
    const timeoutId = setTimeout(() => {
      onSave({
        ...note,
        title,
        messages,
        tags,
        updatedAt: new Date()
      });
    }, 1000); // 1 second delay

    return () => clearTimeout(timeoutId);
  }, [title, note, messages, tags, onSave]);

  // Auto-save when tags change
  useEffect(() => {
    if (!note) return;
    
    // Check if tags have actually changed
    const tagsChanged = tags.length !== note.tags.length || 
                       tags.some((tag, index) => tag !== note.tags[index]);
    
    if (tagsChanged) {
      onSave({
        ...note,
        title,
        messages,
        tags,
        updatedAt: new Date()
      });
    }
  }, [tags, note, title, messages, onSave]);

  const handleAddMessage = () => {
    if (!currentMessage.trim() || !note) return;

    const newMessage: NoteMessage = {
      id: uuidv4(),
      content: currentMessage.trim(),
      timestamp: new Date(),
      type: 'message'
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setCurrentMessage('');

    // Automatically save the note with the new message
    onSave({
      ...note,
      title,
      messages: updatedMessages,
      tags,
      updatedAt: new Date()
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddMessage();
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages(messages.filter(msg => msg.id !== messageId));
  };

  const handleDownloadJSON = () => {
    if (!note) return;

    const exportData = {
      id: note.id,
      title,
      messages: messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
        type: msg.type
      })),
      tags,
      createdAt: note.createdAt.toISOString(),
      updatedAt: new Date().toISOString(),
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'note'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTag();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Get text direction classes
  const getTitleDirection = () => {
    const direction = detectTextDirection(title);
    return direction === 'rtl' ? 'rtl-input hebrew-text' : 'ltr-input';
  };

  const getMessageDirection = (content: string) => {
    const direction = detectTextDirection(content);
    return direction === 'rtl' ? 'rtl-text hebrew-text' : 'ltr-text';
  };

  const getCurrentMessageDirection = () => {
    const direction = detectTextDirection(currentMessage);
    return direction === 'rtl' ? 'rtl-input hebrew-text' : 'ltr-input';
  };

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="w-12 h-12 text-blue-500 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome to NoteSage</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Create a new note or select an existing one to start chatting</p>
          <button
            onClick={onToggleSidebar}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105"
          >
            <Menu className="w-4 h-4" />
            <span>Open Notes</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors lg:hidden"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {note.updatedAt.toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadJSON}
            className="flex items-center space-x-2 px-3 py-2 bg-green-500 dark:bg-green-600 text-white rounded-lg hover:bg-green-600 dark:hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>JSON</span>
          </button>
          <button
            onClick={onToggleChat}
            className={`p-2 rounded-lg transition-colors ${
              isChatOpen 
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'
            }`}
          >
            <MessageCircle className="w-5 h-5" />
          </button>

          <button
            onClick={() => onDelete(note.id)}
            className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Title */}
        <div className="p-6 pb-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title..."
            className={`w-full text-2xl font-bold text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border-none outline-none bg-transparent ${getTitleDirection()}`}
          />
        </div>

        {/* Tags */}
        <div className="px-6 pb-4">
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map(tag => (
              <span
                key={tag}
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 ${getTextDirectionClass(tag)}`}
              >
                <Tag className="w-3 h-3 mr-1" />
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleTagKeyPress}
              placeholder="Add a tag..."
              className={`flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm auto-direction bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400`}
            />
            <button
              onClick={handleAddTag}
              className="ml-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
            >
              Add
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages List */}
          <div className="flex-1 overflow-y-auto px-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-lg">Start your conversation</p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm">Type a message below to begin</p>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={message.id}
                  className="group relative bg-gray-50 dark:bg-gray-800 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className={`text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed ${getMessageDirection(message.content)}`}>
                        {message.content}
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Message {index + 1}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteMessage(message.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex space-x-3">
              <div className="flex-1">
                <textarea
                  ref={textareaRef}
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
                  className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[50px] max-h-32 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${getCurrentMessageDirection()}`}
                  rows={1}
                />
              </div>
              <button
                onClick={handleAddMessage}
                disabled={!currentMessage.trim()}
                className="px-6 py-3 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}