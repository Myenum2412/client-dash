"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Send,
  Phone,
  Video,
  Monitor,
  Clock,
  Calendar,
  RotateCcw,
  CheckCheck,
  Paperclip,
  Mic,
  Square,
} from "lucide-react";
import ConnectWithoutContactIcon from '@mui/icons-material/ConnectWithoutContact';
import Image from "next/image";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useChatMessages, useSendChatMessage } from "@/lib/hooks/use-api";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AIBranch,
  AIBranchMessages,
  AIBranchSelector,
  AIBranchPrevious,
  AIBranchNext,
  AIBranchPage,
} from "@/components/smoothui/ai-branch";
import { EmojiPicker } from "@/components/chat/emoji-picker";
import { FilePreviewList } from "@/components/chat/file-preview";
import { InfiniteScrollTrigger } from "@/components/ui/infinite-scroll-trigger";
import { ConnectUserDialog } from "@/components/chat/connect-user-dialog";
import {
  PhoneCallDialog,
  VideoCallDialog,
  ScreenShareDialog,
  ReminderDialog,
  ScheduleMeetingDialog,
} from "@/components/chat/chat-action-dialogs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

type ChatMessage = {
  id: string;
  role: "me" | "system";
  text: string;
  at: string;
  createdAt?: string; // Full ISO timestamp for date grouping
  isRead?: boolean;
};

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateStr = date.toDateString();
  const todayStr = today.toDateString();
  const yesterdayStr = yesterday.toDateString();

  if (dateStr === todayStr) {
    return "Today";
  } else if (dateStr === yesterdayStr) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString([], { month: "short", day: "numeric", year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined });
  }
}

function shouldShowDateSeparator(currentMsg: ChatMessage, previousMsg: ChatMessage | null): boolean {
  if (!previousMsg) return true;
  const currentTimestamp = currentMsg.createdAt || currentMsg.at;
  const previousTimestamp = previousMsg.createdAt || previousMsg.at;
  const currentDate = new Date(currentTimestamp).toDateString();
  const previousDate = new Date(previousTimestamp).toDateString();
  return currentDate !== previousDate;
}

type ApiMessage = {
  id: string;
  role: "me" | "system";
  text: string;
  created_at: string;
};

export function ChatInterface({ projectId }: { projectId?: string }) {
  const queryClient = useQueryClient();
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useChatMessages(projectId, {
    meta: { errorMessage: "Failed to load messages." },
  });
  const sendMessage = useSendChatMessage();

  // Flatten all pages of messages
  const messages: ChatMessage[] = React.useMemo(() => {
    if (!data) return [];
    // Check if data has pages (useInfiniteQuery format) or is a direct response
    const allMessages = (data as any)?.pages 
      ? (data as any).pages.flatMap((page: any) => page.data ?? [])
      : (data as any)?.data ?? [];
    return allMessages.map((m: any) => ({
      id: String(m.id),
      role: m.role,
      text: m.text,
      at: formatTime(m.created_at),
      createdAt: m.created_at, // Store full timestamp for date grouping
      isRead: m.role === "me", // Assume user messages are read
    }));
  }, [data]);

  // Group messages into conversation branches (user message + AI response pairs)
  const conversationBranches = React.useMemo(() => {
    const branches: ChatMessage[][] = [];
    let currentBranch: ChatMessage[] = [];

    messages.forEach((msg) => {
      if (msg.role === "me") {
        // Start a new branch when we encounter a user message
        if (currentBranch.length > 0) {
          branches.push(currentBranch);
        }
        currentBranch = [msg];
      } else {
        // Add AI/system responses to the current branch
        currentBranch.push(msg);
      }
    });

    // Add the last branch if it exists
    if (currentBranch.length > 0) {
      branches.push(currentBranch);
    }

    return branches;
  }, [messages]);

  const [text, setText] = React.useState("");
  const [files, setFiles] = React.useState<File[]>([]);
  const [isRecording, setIsRecording] = React.useState(false);
  const [mediaRecorder, setMediaRecorder] = React.useState<MediaRecorder | null>(null);
  const [connectDialogOpen, setConnectDialogOpen] = React.useState(false);
  const [phoneDialogOpen, setPhoneDialogOpen] = React.useState(false);
  const [videoDialogOpen, setVideoDialogOpen] = React.useState(false);
  const [screenShareDialogOpen, setScreenShareDialogOpen] = React.useState(false);
  const [reminderDialogOpen, setReminderDialogOpen] = React.useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const bottomRef = React.useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    if (bottomRef.current) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 100);
    }
  }, [messages.length]);

  // Scroll to bottom on initial load
  React.useEffect(() => {
    if (!isLoading && messages.length > 0 && bottomRef.current) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
      }, 300);
    }
  }, [isLoading]);

  // Cleanup media recorder on unmount
  React.useEffect(() => {
    return () => {
      if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
      }
    };
  }, [mediaRecorder, isRecording]);

  // Remove old mutation - using hook instead
  //   // Using centralized hook instead

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      setFiles((prev) => [...prev, ...selectedFiles]);
      toast.success(`${selectedFiles.length} file(s) attached`, {
        description: selectedFiles.map(f => f.name).join(", "),
      });
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEmojiSelect = (emoji: string) => {
    setText((prev) => prev + emoji);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const audioFile = new File([blob], `recording-${Date.now()}.webm`, {
          type: "audio/webm",
        });
        setFiles((prev) => [...prev, audioFile]);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch {
      alert("Failed to start recording. Please check microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  function send() {
    const trimmed = text.trim();
    if (trimmed || files.length > 0) {
      sendMessage.mutate(
        {
          projectId,
          message: trimmed,
          files: files.length > 0 ? files : undefined,
          // audio: audioBlob || undefined, // TODO: Add audio blob state if needed
        },
        {
          onSuccess: () => {
            setText("");
            setFiles([]);
            // setAudioBlob(null); // TODO: Add audio blob state if needed
          },
        }
      );
    }
  }

  const handleRefreshChat = () => {
    queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
    toast.success("Chat refreshed", {
      description: "Messages have been reloaded",
    });
  };

  return (
    <div className="min-h-0 flex flex-1 flex-col p-4 pt-0">
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b pb-4 mb-4">
        <div className="flex items-center gap-4">
          {/* Profile Picture */}
          <div className="relative h-12 w-12 rounded-full bg-black flex items-center justify-center overflow-hidden">
            <div className="h-8 w-8 bg-yellow-400 rounded-full" />
          </div>
          
          {/* Name and Status */}
          <div className="flex flex-col">
          <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">Vel</h2>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                Online
              </span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Project Manager</p>
          </div>
        </div>
        
        {/* Action Icons */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9"
                onClick={() => setPhoneDialogOpen(true)}
              >
                <Phone className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Voice Call</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9"
                onClick={() => setConnectDialogOpen(true)}
              >
                <ConnectWithoutContactIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Connect to another person</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9"
                onClick={() => setVideoDialogOpen(true)}
              >
                <Video className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Video Call</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9"
                onClick={() => setScreenShareDialogOpen(true)}
              >
                <Monitor className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Share Screen</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9"
                onClick={() => setReminderDialogOpen(true)}
              >
                <Clock className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Set Reminder</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9"
                onClick={() => setScheduleDialogOpen(true)}
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Schedule Meeting</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9"
                onClick={handleRefreshChat}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refresh Chat</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border bg-background">
        <ScrollArea className="h-[calc(100vh-16rem)] min-h-[400px]">
          <div className="space-y-4 p-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-2/3" />
                <Skeleton className="h-12 w-1/2 ml-auto" />
                <Skeleton className="h-12 w-3/5" />
              </div>
            ) : null}
            {!isLoading && messages.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                No messages yet. Start a conversation!
              </div>
            ) : null}
            {!isLoading && conversationBranches.length > 0 && (
              <AIBranch className="w-full">
                <AIBranchMessages>
                  {conversationBranches.map((branch, branchIndex) => (
                    <div key={`branch-${branchIndex}`} className="space-y-4">
                      {branch.map((m, msgIndex) => {
                        const previousMsg = msgIndex > 0 ? branch[msgIndex - 1] : 
                          (branchIndex > 0 && conversationBranches[branchIndex - 1].length > 0 
                            ? conversationBranches[branchIndex - 1][conversationBranches[branchIndex - 1].length - 1] 
                            : null);
                        const showDateSeparator = shouldShowDateSeparator(m, previousMsg);
                        
                        return (
                          <React.Fragment key={m.id}>
                            {showDateSeparator && (
                              <div className="flex items-center justify-center my-4">
                                <div className="px-3 py-1 bg-muted rounded-full">
                                  <span className="text-xs text-muted-foreground font-medium">
                                    {formatDate(m.createdAt || m.at)}
                                  </span>
                                </div>
                              </div>
                            )}
                            <div
                              className={cn(
                                "flex flex-col group",
                                m.role === "me" ? "items-end" : "items-start"
                              )}
                            >
                              <div className={cn(
                                "flex items-start gap-2 w-full",
                                m.role === "me" ? "flex-row-reverse" : "flex-row"
                              )}>
                                {m.role === "me" && (
                                  <AIBranchSelector from="user" className="shrink-0">
                                    <AIBranchPrevious />
                                    <AIBranchPage />
                                    <AIBranchNext />
                                  </AIBranchSelector>
                                )}
                                <div
                                  className={cn(
                                    "max-w-[min(680px,75%)] rounded-2xl px-4 py-3 shadow-sm transition-all",
                                    m.role === "me"
                                      ? "bg-blue-600 text-white hover:bg-blue-700"
                                      : "bg-gray-100 text-foreground hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                                  )}
                                >
                                  <div className="text-sm whitespace-pre-wrap leading-relaxed">{m.text}</div>
                                </div>
                                {m.role === "system" && (
                                  <AIBranchSelector from="assistant" className="shrink-0">
                                    <AIBranchPrevious />
                                    <AIBranchPage />
                                    <AIBranchNext />
                                  </AIBranchSelector>
                                )}
                              </div>
                              <div className={cn(
                                "flex items-center gap-1 mt-1 px-1",
                                m.role === "me" ? "flex-row-reverse" : "flex-row"
                              )}>
                                <span className="text-xs text-muted-foreground">{m.at}</span>
                                {m.role === "me" && m.isRead && (
                                  <CheckCheck className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                )}
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  ))}
                </AIBranchMessages>
              </AIBranch>
            )}
            <InfiniteScrollTrigger
              onLoadMore={() => fetchNextPage()}
              hasNextPage={hasNextPage ?? false}
              isFetchingNextPage={isFetchingNextPage}
            />
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
        </div>

      {/* Message Input */}
      <div className="pt-4 border-t space-y-2">
        {/* File Previews */}
        <FilePreviewList files={files} onRemove={handleRemoveFile} />

      {/* Input Area */}
        <div className="flex items-end gap-2">
          {/* File Upload Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => {
                  fileInputRef.current?.click();
                  toast.info("Select files to attach");
                }}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Attach File</TooltipContent>
          </Tooltip>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,application/pdf,.doc,.docx,.txt,.csv,.json"
          />

          {/* Text Input */}
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />

          {/* Emoji Picker */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <EmojiPicker onEmojiSelect={(emoji) => {
                  handleEmojiSelect(emoji);
                  toast.success("Emoji added", { duration: 1000 });
                }} />
              </div>
            </TooltipTrigger>
            <TooltipContent>Add Emoji</TooltipContent>
          </Tooltip>

          {/* Microphone Button */}
          {!isRecording ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => {
                      startRecording();
                      toast.success("Recording started", { duration: 2000 });
                    }}
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>Record Voice Message</TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => {
                      stopRecording();
                      toast.success("Recording stopped and attached", { duration: 2000 });
                    }}
                  >
                    <Square className="h-4 w-4 fill-current" />
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>Stop Recording</TooltipContent>
            </Tooltip>
          )}

          {/* Send Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={() => {
                    send();
                    if (text.trim() || files.length > 0) {
                      toast.success("Message sent", { duration: 1500 });
                    }
                  }}
                  disabled={(!text.trim() && files.length === 0) || sendMessage.isPending}
                  size="icon"
                  className="h-9 w-9 shrink-0 bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="size-4" />
                </Button>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent>Send Message</TooltipContent>
          </Tooltip>
        </div>
            </div>
      <ConnectUserDialog
        open={connectDialogOpen}
        onOpenChange={setConnectDialogOpen}
        projectId={projectId}
      />
      <PhoneCallDialog
        open={phoneDialogOpen}
        onOpenChange={setPhoneDialogOpen}
        contactName="Vel"
      />
      <VideoCallDialog
        open={videoDialogOpen}
        onOpenChange={setVideoDialogOpen}
        contactName="Vel"
      />
      <ScreenShareDialog
        open={screenShareDialogOpen}
        onOpenChange={setScreenShareDialogOpen}
      />
      <ReminderDialog
        open={reminderDialogOpen}
        onOpenChange={setReminderDialogOpen}
      />
      <ScheduleMeetingDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
      />
    </div>
  );
}


