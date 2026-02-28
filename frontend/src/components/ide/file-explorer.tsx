'use client';

import { useState, useRef, useEffect } from 'react';
import { Folder, FolderOpen, Plus, Trash2, Pencil, Check, X, FileCode, ChevronRight, ChevronDown, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from '@/contexts/session-context';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', icon: '📜', extension: '.js' },
  { id: 'typescript', name: 'TypeScript', icon: '📘', extension: '.ts' },
  { id: 'python', name: 'Python', icon: '🐍', extension: '.py' },
  { id: 'java', name: 'Java', icon: '☕', extension: '.java' },
  { id: 'cpp', name: 'C++', icon: '⚙️', extension: '.cpp' },
  { id: 'c', name: 'C', icon: '⚙️', extension: '.c' },
  { id: 'csharp', name: 'C#', icon: '#️⃣', extension: '.cs' },
  { id: 'html', name: 'HTML', icon: '🌐', extension: '.html' },
  { id: 'css', name: 'CSS', icon: '🎨', extension: '.css' },
];

const getLanguageIcon = (language: string) => {
  const lang = LANGUAGES.find(l => l.id === language);
  return lang?.icon || '📄';
};

export function FileExplorer({ isCollapsed = false, onCollapse }: { isCollapsed?: boolean; onCollapse?: (collapsed: boolean) => void }) {
  const { files, currentFileId, setCurrentFileId, createFile, deleteFile, renameFile, createFolder, renameFolder, deleteFolder, session } = useSession();
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [newFolderName, setNewFolderName] = useState('New Folder');
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingFileId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingFileId]);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const canEdit = session ? ['host', 'co-host', 'editor'].includes(session.role) : true;

  const handleCreateFile = (langId: string, parentId: string | null = null) => {
    const lang = LANGUAGES.find(l => l.id === langId);
    const fileName = `untitled${lang?.extension || '.txt'}`;
    createFile(fileName, langId, parentId);
    setIsCreating(false);
    if (parentId) {
      setExpandedFolders(prev => new Set([...prev, parentId]));
    }
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim(), newFolderParentId);
    }
    setIsCreatingFolder(false);
    setNewFolderParentId(null);
    setNewFolderName('New Folder');
  };

  const handleCreateFolderInFolder = (parentId: string | null) => {
    createFolder('New Folder', parentId);
    if (parentId) {
      setExpandedFolders(prev => new Set([...prev, parentId]));
    }
  };

  const handleDeleteFile = (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const file = files.find(f => f.id === fileId);
    if (file?.isFolder) {
      if (confirm('Delete this folder and all its contents?')) {
        deleteFolder(fileId);
      }
    } else {
      if (files.length <= 1) return;
      if (confirm('Delete this file?')) {
        deleteFile(fileId);
      }
    }
  };

  const handleRename = (fileId: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const file = files.find(f => f.id === fileId);
    setEditingFileId(fileId);
    setEditingName(currentName);
  };

  const handleRenameSubmit = () => {
    if (editingFileId && editingName.trim()) {
      const file = files.find(f => f.id === editingFileId);
      if (file?.isFolder) {
        renameFolder(editingFileId, editingName.trim());
      } else {
        renameFile(editingFileId, editingName.trim());
      }
    }
    setEditingFileId(null);
    setEditingName('');
  };

  const handleRenameCancel = () => {
    setEditingFileId(null);
    setEditingName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      handleRenameCancel();
    }
  };

  if (isCollapsed) {
    return (
      <aside className="flex-shrink-0 border-r bg-secondary/30 flex flex-col items-center py-4 gap-4 transition-all duration-300 h-full w-full">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-secondary"
          onClick={() => onCollapse?.(false)}
          title="Expand"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="w-full h-px bg-border/50" />
        <div className="flex flex-col items-center gap-2">
          <Folder className="h-5 w-5 text-yellow-500" />
        </div>
      </aside>
    );
  }

  return (
    <aside className="border-r bg-secondary/30 p-2 flex flex-col h-full w-full">
      <div className="flex items-center justify-between p-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground"
            onClick={() => onCollapse?.(true)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">Files</h2>
        </div>
        {canEdit && (
          <DropdownMenu open={isCreating} onOpenChange={setIsCreating}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                setIsCreating(false);
                setIsCreatingFolder(true);
              }}>
                <Folder className="h-4 w-4 mr-2" />
                New Folder
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {LANGUAGES.map(lang => (
                <DropdownMenuItem key={lang.id} onClick={() => handleCreateFile(lang.id)}>
                  <span className="mr-2">{lang.icon}</span>
                  {lang.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {isCreatingFolder && (
          <div className="flex items-center h-8 px-2 rounded-md text-sm">
            <Folder className="h-4 w-4 mr-2 text-yellow-500" />
            <input
              ref={inputRef}
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFolder();
                } else if (e.key === 'Escape') {
                  setIsCreatingFolder(false);
                  setNewFolderName('New Folder');
                }
              }}
              onBlur={handleCreateFolder}
              className="flex-1 bg-background border border-primary rounded px-1 text-xs"
              autoFocus
            />
          </div>
        )}
        
        {files.length === 0 && !isCreatingFolder ? (
          <div className="text-center text-muted-foreground text-sm py-4">
            No files yet
          </div>
        ) : (
          <FileTree
            files={files}
            currentFileId={currentFileId}
            expandedFolders={expandedFolders}
            editingFileId={editingFileId}
            editingName={editingName}
            canEdit={canEdit}
            onToggleFolder={toggleFolder}
            onSelectFile={setCurrentFileId}
            onRename={handleRename}
            onRenameSubmit={handleRenameSubmit}
            onRenameCancel={handleRenameCancel}
            onDelete={handleDeleteFile}
            onKeyDown={handleKeyDown}
            inputRef={inputRef}
            setEditingName={setEditingName}
            createFile={handleCreateFile}
            createFolder={(parentId: string | null) => {
              handleCreateFolderInFolder(parentId);
            }}
          />
        )}
      </div>
      
      {session && (
        <div className="mt-2 pt-2 border-t text-xs text-muted-foreground px-2">
          <div className="flex items-center gap-1">
            <Folder className="h-3 w-3" />
            <span>Session: {session.sessionId.slice(0, 8)}...</span>
          </div>
        </div>
      )}
    </aside>
  );
}

interface FileTreeProps {
  files: ReturnType<typeof useSession>['files'];
  currentFileId: string | null;
  expandedFolders: Set<string>;
  editingFileId: string | null;
  editingName: string;
  canEdit: boolean;
  onToggleFolder: (id: string) => void;
  onSelectFile: (id: string) => void;
  onRename: (id: string, name: string, e: React.MouseEvent) => void;
  onRenameSubmit: () => void;
  onRenameCancel: () => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  setEditingName: (name: string) => void;
  createFile: (langId: string, parentId: string | null) => void;
  createFolder: (parentId: string | null) => void;
}

function FileTree({
  files,
  currentFileId,
  expandedFolders,
  editingFileId,
  editingName,
  canEdit,
  onToggleFolder,
  onSelectFile,
  onRename,
  onRenameSubmit,
  onRenameCancel,
  onDelete,
  onKeyDown,
  inputRef,
  setEditingName,
  createFile,
  createFolder,
}: FileTreeProps) {
  const [contextMenuFolder, setContextMenuFolder] = useState<string | null>(null);

  const rootItems = files.filter(f => !f.parentId);
  const getChildren = (parentId: string) => files.filter(f => f.parentId === parentId);

  const renderItem = (item: typeof files[0], depth: number = 0) => {
    const isExpanded = expandedFolders.has(item.id);
    const isFolder = item.isFolder;
    const children = isFolder ? getChildren(item.id) : [];

    return (
      <div key={item.id}>
        {editingFileId === item.id ? (
          <div
            className="flex items-center h-8 px-2 rounded-md text-sm"
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            onClick={(e) => e.stopPropagation()}
          >
            {isFolder ? (
              <Folder className="h-4 w-4 mr-2 text-yellow-500" />
            ) : (
              <span className="mr-2 text-base">{getLanguageIcon(item.language)}</span>
            )}
            <input
              ref={inputRef}
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onKeyDown={onKeyDown}
              onBlur={onRenameSubmit}
              className="flex-1 bg-background border border-primary rounded px-1 text-xs"
              autoFocus
            />
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onRenameSubmit}>
              <Check className="h-3 w-3 text-green-500" />
            </Button>
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onRenameCancel}>
              <X className="h-3 w-3 text-red-500" />
            </Button>
          </div>
        ) : (
          <DropdownMenu open={contextMenuFolder === item.id} onOpenChange={(open) => {
            if (!open) setContextMenuFolder(null);
          }}>
            <div
              className={cn(
                "group flex items-center h-8 px-2 rounded-md cursor-pointer text-sm",
                currentFileId === item.id
                  ? "bg-primary/20 text-foreground"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
              onClick={() => {
                if (isFolder) {
                  onToggleFolder(item.id);
                } else {
                  onSelectFile(item.id);
                }
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                if (canEdit) {
                  setContextMenuFolder(item.id);
                }
              }}
            >
              {isFolder ? (
                <>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 mr-1" />
                  ) : (
                    <ChevronRight className="h-4 w-4 mr-1" />
                  )}
                  {isExpanded ? (
                    <FolderOpen className="h-4 w-4 mr-2 text-yellow-500" />
                  ) : (
                    <Folder className="h-4 w-4 mr-2 text-yellow-500" />
                  )}
                </>
              ) : (
                <>
                  <span className="w-4 mr-2" />
                  <span className="mr-2 text-base">{getLanguageIcon(item.language)}</span>
                </>
              )}
              
              <span className="flex-1 truncate">{item.name}</span>
              
              {canEdit && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isFolder && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => createFile('javascript', item.id)}>
                          <span className="mr-2">📜</span>
                          New File
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => createFolder(item.id)}>
                          <Folder className="h-4 w-4 mr-2" />
                          New Folder
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => onRename(item.id, item.name, e)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => onDelete(item.id, e)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              )}
            </div>
            
            {isFolder && canEdit && (
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => {
                  createFile('javascript', item.id);
                  setContextMenuFolder(null);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  New File
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  createFolder(item.id);
                  setContextMenuFolder(null);
                }}>
                  <Folder className="h-4 w-4 mr-2" />
                  New Folder
                </DropdownMenuItem>
              </DropdownMenuContent>
            )}
          </DropdownMenu>
        )}
        
        {isFolder && isExpanded && children.map(child => renderItem(child, depth + 1))}
      </div>
    );
  };

  return (
    <>
      {rootItems.map(item => renderItem(item))}
    </>
  );
}
