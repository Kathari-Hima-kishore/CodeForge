'use client';

import React, { useState, useRef, useEffect, Suspense, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Code, Play, Loader2, X, FileCode, File } from 'lucide-react';
import { useSession } from '@/contexts/session-context';
import { LucideIcon } from 'lucide-react';

// Lazy load Monaco Editor
const MonacoEditor = React.lazy(() => import('@monaco-editor/react'));

const LANGUAGES: { id: string; name: string; icon: LucideIcon; extension: string; monacoId: string }[] = [
  { id: 'javascript', name: 'JavaScript', icon: FileCode, extension: '.js', monacoId: 'javascript' },
  { id: 'typescript', name: 'TypeScript', icon: FileCode, extension: '.ts', monacoId: 'typescript' },
  { id: 'python', name: 'Python', icon: FileCode, extension: '.py', monacoId: 'python' },
  { id: 'java', name: 'Java', icon: FileCode, extension: '.java', monacoId: 'java' },
  { id: 'cpp', name: 'C++', icon: FileCode, extension: '.cpp', monacoId: 'cpp' },
  { id: 'c', name: 'C', icon: FileCode, extension: '.c', monacoId: 'c' },
  { id: 'csharp', name: 'C#', icon: FileCode, extension: '.cs', monacoId: 'csharp' },
  { id: 'html', name: 'HTML', icon: FileCode, extension: '.html', monacoId: 'html' },
  { id: 'css', name: 'CSS', icon: FileCode, extension: '.css', monacoId: 'css' },
];

const getLanguageIcon = (language: string): LucideIcon => {
  const lang = LANGUAGES.find(l => l.id === language);
  return lang?.icon || File;
};

const getMonacoLanguage = (language: string): string => {
  const lang = LANGUAGES.find(l => l.id === language);
  return lang?.monacoId || 'plaintext';
};

export function CodeEditorPanel() {
  const {
    files,
    currentFileId,
    setCurrentFileId,
    updateFileContent,
    executeCode,
    isExecuting,
    session,
    user,
  } = useSession();

  const editorRef = useRef<any>(null);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [localOpenFileIds, setLocalOpenFileIds] = useState<string[]>([]);

  // Initialize open files when files change
  useEffect(() => {
    const fileIds = files.filter(f => !f.isFolder).map(f => f.id);
    if (localOpenFileIds.length === 0 && fileIds.length > 0) {
      setLocalOpenFileIds(fileIds);
    } else {
      // Filter out deleted files
      setLocalOpenFileIds(prev => prev.filter(id => fileIds.includes(id)));
    }
  }, [files]);

  const currentFile = files.find(f => f.id === currentFileId);
  const code = currentFile?.content || '';

  // Check if user has editor role
  const canEdit = session ? ['host', 'co-host', 'editor'].includes(session.role) : true;

  const handleCodeChange = useCallback((value: string | undefined) => {
    if (currentFileId && canEdit && value !== undefined) {
      updateFileContent(currentFileId, value);
    }
  }, [currentFileId, canEdit, updateFileContent]);

  const handleRun = async () => {
    if (!currentFile) return;
    executeCode(currentFile.language, currentFile.content);
  };

  const handleEditorMount = (editor: any) => {
    editorRef.current = editor;
    editor.onDidChangeCursorPosition((e: any) => {
      setCursorPosition({ line: e.position.lineNumber, column: e.position.column });
    });
    editor.focus();
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleRun]);

  // Release lock when file tab is closed
  const handleCloseFile = (fileId: string) => {
    const newOpenFiles = localOpenFileIds.filter(id => id !== fileId);
    setLocalOpenFileIds(newOpenFiles);
    if (currentFileId === fileId) {
      if (newOpenFiles.length > 0) {
        setCurrentFileId(newOpenFiles[0]);
      } else {
        setCurrentFileId(null as unknown as string);
      }
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0 bg-[#1e1e1e] text-gray-200">
      {/* File tabs - only show when there are open files */}
      {localOpenFileIds.length > 0 && (
        <div className="flex items-center border-b border-gray-700 h-10 px-2 overflow-x-auto bg-[#252526] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
          {localOpenFileIds.map(fileId => {
            const file = files.find(f => f.id === fileId);
            if (!file || file.isFolder) return null;
            const Icon = getLanguageIcon(file.language);
            const isActive = file.id === currentFileId;
            const handleClose = (e: React.MouseEvent) => {
              e.stopPropagation();
              handleCloseFile(file.id);
            };
            const FileIcon = Icon;
            return (
              <div
                key={file.id}
                className={`group flex items-center gap-2 px-4 h-full text-sm border-r border-gray-700 cursor-pointer transition-all duration-150 flex-shrink-0 relative ${
                  isActive
                    ? 'bg-[#1e1e1e] text-white before:content-[""] before:absolute before:bottom-0 before:left-0 before:right-0 before:h-[2px] before:bg-blue-500'
                    : 'bg-[#2d2d2d] text-gray-400 hover:text-white hover:bg-[#37373d]'
                }`}
                onClick={() => setCurrentFileId(file.id)}
              >
                <FileIcon className="h-4 w-4" />
                <span className="max-w-[120px] truncate font-medium">{file.name}</span>
                <button
                  onClick={handleClose}
                  className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all ml-1 rounded-sm hover:bg-red-500/20 p-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-700 h-12 px-4 bg-[#252526]">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4 text-blue-400" />
            <span className="font-semibold text-gray-200">{currentFile?.name || 'No file'}</span>
          </div>
          <span className="text-gray-500 text-xs font-mono bg-[#3c3c3c] px-2 py-0.5 rounded">
            Ln {cursorPosition.line}, Col {cursorPosition.column}
          </span>
          {!canEdit && (
            <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2.5 py-1 rounded-full font-medium border border-yellow-500/20">
              👁 View Only
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold"
            onClick={handleRun}
            disabled={isExecuting || !currentFile}
          >
            {isExecuting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isExecuting ? 'Running...' : 'Run'}
          </Button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full bg-[#1e1e1e]">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                <span className="text-sm text-gray-400">Loading editor...</span>
              </div>
            </div>
          }
        >
          <MonacoEditor
            height="100%"
            language={getMonacoLanguage(currentFile?.language || 'plaintext')}
            value={code}
            onChange={handleCodeChange}
            onMount={handleEditorMount}
            theme="vs-dark"
            options={{
              readOnly: !canEdit,
              minimap: { enabled: true },
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              lineNumbers: 'on',
              renderLineHighlight: 'all',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 4,
              wordWrap: 'on',
              padding: { top: 16, bottom: 16 },
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              smoothScrolling: true,
            }}
          />
        </Suspense>
      </div>
    </div>
  );
}
