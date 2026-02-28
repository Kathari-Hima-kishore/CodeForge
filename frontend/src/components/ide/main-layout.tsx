'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { IdeHeader } from '@/components/ide/header';
import { FileExplorer } from '@/components/ide/file-explorer';
import { CodeEditorPanel } from '@/components/ide/code-editor-panel';
import { CollaborationPanel } from '@/components/ide/collaboration-panel';
import { BottomPanel } from '@/components/ide/bottom-panel';

function ResizeHandle({ onResize, direction = 'horizontal' }: {
  onResize: (delta: number) => void;
  direction?: 'horizontal' | 'vertical';
}) {
  const isDragging = useRef(false);
  const startPos = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDragging.current = true;
    startPos.current = direction === 'horizontal' ? e.clientX : e.clientY;
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  }, [direction]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
      const delta = currentPos - startPos.current;
      startPos.current = currentPos;
      onResize(delta);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onResize, direction]);

  return (
    <div
      className={direction === 'horizontal' 
        ? 'w-0.5 bg-border hover:bg-primary/80 cursor-col-resize flex-shrink-0 z-10 transition-colors group relative' 
        : 'h-0.5 bg-border hover:bg-primary/80 cursor-row-resize flex-shrink-0 z-10 transition-colors group relative'
      }
      onMouseDown={handleMouseDown}
    >
      <div className={direction === 'horizontal' 
        ? 'absolute inset-y-0 -left-0.5 -right-0.5 group-hover:bg-primary/20' 
        : 'absolute inset-x-0 -top-0.5 -bottom-0.5 group-hover:bg-primary/20'
      } />
    </div>
  );
}

export function MainLayout() {
  const [filesCollapsed, setFilesCollapsed] = useState(false);
  const [chatCollapsed, setChatCollapsed] = useState(false);
  
  const [leftWidth, setLeftWidth] = useState(200);
  const [middleWidth, setMiddleWidth] = useState(280);
  const [bottomHeight, setBottomHeight] = useState(200);

  const handleLeftResize = useCallback((delta: number) => {
    setLeftWidth(prev => Math.max(120, Math.min(400, prev + delta)));
  }, []);

  const handleMiddleResize = useCallback((delta: number) => {
    setMiddleWidth(prev => Math.max(120, Math.min(500, prev + delta)));
  }, []);

  const handleVerticalResize = useCallback((delta: number) => {
    setBottomHeight(prev => Math.max(100, Math.min(500, prev - delta)));
  }, []);

  const getFilesWidth = () => filesCollapsed ? 48 : leftWidth;
  const getChatWidth = () => chatCollapsed ? 48 : middleWidth;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground font-body">
      <IdeHeader />
      <div className="flex flex-1 overflow-hidden">
        <div style={{ width: getFilesWidth() }} className="h-full flex-shrink-0">
          <FileExplorer isCollapsed={filesCollapsed} onCollapse={setFilesCollapsed} />
        </div>
        
        {!filesCollapsed && <ResizeHandle onResize={handleLeftResize} direction="horizontal" />}
        
        <div style={{ width: getChatWidth() }} className="h-full flex-shrink-0">
          <CollaborationPanel isCollapsed={chatCollapsed} onCollapse={setChatCollapsed} />
        </div>
        
        {!chatCollapsed && <ResizeHandle onResize={handleMiddleResize} direction="horizontal" />}
        
        <div className="flex flex-col flex-1 h-full min-w-0">
          <div className="flex-1 min-h-0 overflow-hidden">
            <CodeEditorPanel />
          </div>
          <ResizeHandle onResize={handleVerticalResize} direction="vertical" />
          <div style={{ height: bottomHeight }} className="flex-shrink-0 overflow-hidden">
            <BottomPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
