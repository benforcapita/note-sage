import React, { useRef } from 'react';
import { FolderOpen, Plus, Download, MessageCircle, Trash2 } from 'lucide-react';
import { workspaceManager, WorkspaceData } from '../utils/workspace';

interface WorkspaceManagerProps {
  onWorkspaceLoad: (data: WorkspaceData) => void;
  onError: (message: string) => void;
  currentWorkspaceFile: string | null;
  onToggleChat: () => void;
  isChatOpen: boolean;
  onDeleteChat: () => void;
  hasSelectedNote: boolean;
}

export function WorkspaceManager({ onWorkspaceLoad, onError, currentWorkspaceFile, onToggleChat, isChatOpen, onDeleteChat, hasSelectedNote }: WorkspaceManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLoadWorkspace = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await workspaceManager.loadWorkspace(file);
      onWorkspaceLoad(data);
    } catch (error) {
      onError('Failed to load workspace file. Please check the file format.');
    }

    // Reset input
    event.target.value = '';
  };

  const handleSaveWorkspace = async () => {
    try {
      const blob = await workspaceManager.saveWorkspace();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = currentWorkspaceFile || `workspace-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      onError('Failed to save workspace file.');
    }
  };

  const handleNewWorkspace = () => {
    if (window.confirm('Create a new workspace? This will clear all current data.')) {
      const data = workspaceManager.createNewWorkspace();
      onWorkspaceLoad(data);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* New Workspace Button */}
      <button
        onClick={handleNewWorkspace}
        className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
        title="Create New Workspace"
      >
        <Plus className="w-3 h-3" />
        <span>New</span>
      </button>

      {/* Load Workspace Button */}
      <button
        onClick={handleLoadWorkspace}
        className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
        title="Load Workspace"
      >
        <FolderOpen className="w-3 h-3" />
        <span>Load</span>
      </button>

      {/* Save Workspace Button */}
      <button
        onClick={handleSaveWorkspace}
        className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-purple-500 hover:bg-purple-600 text-white rounded transition-colors"
        title="Save Workspace"
      >
        <Download className="w-3 h-3" />
        <span>Save</span>
      </button>

      {/* Toggle AI Assistant */}
      <button
        onClick={onToggleChat}
        className={`flex items-center space-x-1 px-3 py-1.5 text-xs rounded transition-colors ${
          isChatOpen ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
        }`}
        title={isChatOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
      >
        <MessageCircle className="w-3 h-3" />
        <span>AI</span>
      </button>

      {/* Delete Chat Button */}
      <button
        onClick={onDeleteChat}
        disabled={!hasSelectedNote}
        className="flex items-center space-x-1 px-3 py-1.5 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Delete Current Chat"
      >
        <Trash2 className="w-3 h-3" />
        <span>Delete</span>
      </button>

      {/* Current workspace indicator */}
      {currentWorkspaceFile && (
        <div className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-32" title={currentWorkspaceFile}>
          {currentWorkspaceFile}
        </div>
      )}
    </div>
  );
}