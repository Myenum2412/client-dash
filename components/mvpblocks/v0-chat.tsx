'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useAutoResizeTextarea } from '@/hooks/use-auto-resize-textarea';
import {
  ImageIcon,
  FileUp,
  Figma,
  MonitorIcon,
  CircleUserRound,
  ArrowUpIcon,
  Paperclip,
  PlusIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function VercelV0Chat() {
  const [value, setValue] = useState('');
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 60,
    maxHeight: 200,
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        setValue('');
        adjustHeight(true);
      }
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center space-y-4 p-4 py-24 sm:space-y-8">
      <h1 className="text-foreground text-center text-2xl font-bold sm:text-4xl">
        How can I help you today?
      </h1>

      <div className="w-full">
        <div className="bg-background border-border relative rounded-xl border shadow-sm">
          <div className="overflow-y-auto">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                adjustHeight();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask AI a question..."
              className={cn(
                'w-full px-4 py-3',
                'resize-none',
                'bg-transparent',
                'border-none',
                'text-sm',
                'text-foreground',
                'focus:outline-none',
                'focus-visible:ring-0 focus-visible:ring-offset-0',
                'placeholder:text-muted-foreground',
                'placeholder:text-sm',
                'min-h-[60px]',
              )}
              style={{
                overflow: 'hidden',
              }}
            />
          </div>

          <div className="flex items-center justify-between p-3 border-t">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="group hover:bg-muted flex items-center gap-1 rounded-lg p-2 text-muted-foreground hover:text-foreground"
              >
                <Paperclip className="h-4 w-4" />
                <span className="hidden text-xs transition-opacity group-hover:inline">
                  Attach
                </span>
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="border-border hover:bg-muted flex items-center justify-between gap-1 rounded-lg border border-dashed px-2 py-1 text-sm transition-colors text-muted-foreground hover:text-foreground"
              >
                <PlusIcon className="h-4 w-4" />
                New Chat
              </Button>
              <button
                type="button"
                className={cn(
                  'border-border flex items-center justify-between gap-1 rounded-lg border px-1.5 py-1.5 text-sm transition-colors',
                  value.trim() 
                    ? 'bg-foreground text-background hover:bg-foreground/90' 
                    : 'text-muted-foreground bg-transparent hover:bg-muted',
                )}
              >
                <ArrowUpIcon
                  className={cn(
                    'h-4 w-4',
                    value.trim() ? 'text-background' : 'text-muted-foreground',
                  )}
                />
                <span className="sr-only">Send</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-center">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 w-full max-w-2xl">
            <ActionButton
              icon={<ImageIcon className="h-4 w-4" />}
              label="Project Questions"
            />
            <ActionButton
              icon={<Figma className="h-4 w-4" />}
              label="Document Help"
            />
            <ActionButton
              icon={<FileUp className="h-4 w-4" />}
              label="Data Analysis"
            />
            <ActionButton
              icon={<MonitorIcon className="h-4 w-4" />}
              label="Quick Answers"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
}

function ActionButton({ icon, label }: ActionButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className="border-border hover:bg-muted bg-background flex w-full items-center justify-center gap-2 rounded-full border px-3 py-2 whitespace-nowrap transition-colors"
    >
      {icon}
      <span className="text-xs">{label}</span>
    </Button>
  );
}

export default VercelV0Chat;
