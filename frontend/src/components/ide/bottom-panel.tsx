'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Terminal, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSession } from "@/contexts/session-context";
import { useEffect, useRef } from "react";

export function BottomPanel() {
  const { output, isExecuting, clearOutput, isConnected, sendTerminalCommand, files, currentFileId } = useSession();
  const outputBottomRef = useRef<HTMLDivElement>(null);
  const terminalBottomRef = useRef<HTMLDivElement>(null);

  const currentFile = files.find(f => f.id === currentFileId);

  const getVersionCommand = (language: string | undefined): string => {
    const commands: Record<string, string> = {
      javascript: 'node --version',
      typescript: 'npx ts-node --version',
      python: 'python --version',
      java: 'java --version',
      cpp: 'g++ --version',
      c: 'gcc --version',
      csharp: 'dotnet --version',
      html: 'echo "HTML opens in browser"',
      css: 'echo "CSS opens in browser"',
    };
    return commands[language || ''] || 'echo "Select a file to see available commands"';
  };

  const versionCommand = getVersionCommand(currentFile?.language);

  // Auto-scroll to bottom of output
  useEffect(() => {
    if (outputBottomRef.current) {
      outputBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [output, isExecuting]);

  // Auto-scroll to bottom of terminal
  useEffect(() => {
    if (terminalBottomRef.current) {
      terminalBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [output]);

  return (
    <div className="h-full border-t border-border/50 flex flex-col bg-card/30">
      <Tabs defaultValue="output" className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center px-3 border-b border-border/50 h-10 bg-secondary/30 shrink-0">
          <TabsList className="grid grid-cols-2 bg-background/50">
            <TabsTrigger value="output" className="gap-2 text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <Play className="h-3 w-3" />
              Output
              {isExecuting && <Loader2 className="h-3 w-3 animate-spin ml-1" />}
            </TabsTrigger>
            <TabsTrigger value="terminal" className="gap-2 text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <Terminal className="h-3 w-3" /> Terminal
            </TabsTrigger>
          </TabsList>
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={clearOutput}
              title="Clear output"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="output" className="data-[state=active]:flex-1 data-[state=active]:flex data-[state=active]:flex-col overflow-hidden m-0">
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full scrollbar-thin">
              <div className="font-mono text-sm p-4 whitespace-pre-wrap">
                {output.length === 0 ? (
                  <div className="text-muted-foreground flex flex-col gap-2">
                    <span>💻 Code output will appear here...</span>
                    <span className="text-xs">Press <kbd className="px-1.5 py-0.5 rounded bg-secondary border border-border/50 text-xs">Ctrl+Enter</kbd> or click <span className="text-accent font-medium">Run</span> to execute your code.</span>
                  </div>
                ) : (
                  output.map((item, index) => (
                    <div
                      key={index}
                      className={`mb-2 ${item.type === 'error'
                        ? 'text-destructive'
                        : item.type === 'info'
                          ? 'text-blue-400'
                          : item.type === 'success'
                            ? 'text-accent'
                            : 'text-foreground'
                        }`}
                    >
                      {item.type !== 'output' && (
                        <span className="text-muted-foreground text-xs">
                          [{new Date(item.timestamp).toLocaleTimeString()}]{' '}
                        </span>
                      )}
                      {item.content}
                    </div>
                  ))
                )}
                {isExecuting && (
                  <div className="flex items-center gap-2 text-primary mt-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Executing...</span>
                  </div>
                )}
                <div ref={outputBottomRef} />
              </div>
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="terminal" className="data-[state=active]:flex-1 data-[state=active]:flex data-[state=active]:flex-col m-0 overflow-hidden">
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="p-4 font-mono text-sm">
                <div className="flex flex-col gap-1">
                  <p className="text-muted-foreground/50 mb-4">CodeForge Terminal v1.0.0 (Windows)</p>
                  {output.filter(o => o.type !== 'success').map((item, i) => (
                    <div key={i} className="whitespace-pre-wrap break-all">
                      {item.type === 'output' && item.content.startsWith('> ') ? (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-accent">user@codeforge</span>
                          <span className="text-primary">:</span>
                          <span className="text-blue-400">~/project</span>
                          <span className="text-foreground">$ {item.content.substring(2)}</span>
                        </div>
                      ) : (
                        <span className={item.type === 'error' ? 'text-destructive' : 'text-foreground/90'}>
                          {item.content}
                        </span>
                      )}
                    </div>
                  ))}
                  <div ref={terminalBottomRef} />
                </div>
              </div>
            </ScrollArea>
          </div>

          <div className="p-2 border-t border-border/50 bg-background/50 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const input = form.elements.namedItem('cmd') as HTMLInputElement;
                if (input.value.trim()) {
                  sendTerminalCommand(input.value);
                  input.value = '';
                }
              }}
              className="flex items-center gap-2"
            >
              <span className="text-accent text-sm font-bold">$</span>
              <input
                name="cmd"
                autoComplete="off"
                className="flex-1 bg-transparent border-none outline-none text-sm font-mono text-foreground placeholder:text-muted-foreground/50"
                placeholder={`Type a command (e.g. ${versionCommand})...`}
              />
            </form>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
