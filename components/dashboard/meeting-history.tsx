"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarIcon, Clock, Users, FileText } from "lucide-react";
import { format } from "date-fns";
import { motion } from "motion/react";

type MeetingHistoryItem = {
  id: string;
  title: string;
  date: string;
  time: string;
  member: string;
  project: string;
  description?: string;
  status: "completed" | "upcoming" | "cancelled";
};

// Mock data for meeting history - replace with API call later
const mockMeetingHistory: MeetingHistoryItem[] = [
  {
    id: "1",
    title: "Project Review Meeting",
    date: "2024-01-15",
    time: "10:00",
    member: "Vel",
    project: "Project Alpha",
    description: "Review project progress and discuss upcoming milestones",
    status: "completed",
  },
  {
    id: "2",
    title: "Team Standup",
    date: "2024-01-14",
    time: "09:00",
    member: "Rajesh",
    project: "Project Beta",
    description: "Daily standup meeting",
    status: "completed",
  },
];

const getStatusVariant = (status: MeetingHistoryItem["status"]) => {
  switch (status) {
    case "completed":
      return "default";
    case "upcoming":
      return "secondary";
    case "cancelled":
      return "destructive";
    default:
      return "outline";
  }
};

const getStatusLabel = (status: MeetingHistoryItem["status"]) => {
  switch (status) {
    case "completed":
      return "Completed";
    case "upcoming":
      return "Upcoming";
    case "cancelled":
      return "Cancelled";
    default:
      return "Unknown";
  }
};

interface MeetingHistoryProps {
  onMeetingScheduled?: () => void;
}

export function MeetingHistory({ onMeetingScheduled }: MeetingHistoryProps = {}) {
  const [meetings] = React.useState<MeetingHistoryItem[]>(mockMeetingHistory);
  const [isMounted, setIsMounted] = React.useState(false);

  // Track if component is mounted on client to prevent hydration mismatch
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Refresh meetings when a new one is scheduled
  React.useEffect(() => {
    if (onMeetingScheduled) {
      // In a real implementation, you would fetch from API here
      // For now, we'll just refresh the list
    }
  }, [onMeetingScheduled]);

  // Sort meetings by date (most recent first)
  const sortedMeetings = React.useMemo(() => {
    return [...meetings].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`).getTime();
      const dateB = new Date(`${b.date}T${b.time}`).getTime();
      return dateB - dateA;
    });
  }, [meetings]);

  return (
    <Card className="w-full shadow-lg overflow-hidden h-full flex flex-col">
      <CardHeader className="border-b shrink-0">
        <CardTitle className="text-lg">Meeting History</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-3">
            {sortedMeetings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No meetings found</p>
              </div>
            ) : (
              sortedMeetings.map((meeting, index) => (
                <motion.div
                  key={meeting.id}
                  initial={false}
                  animate={isMounted ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
                  transition={isMounted ? { delay: index * 0.05 } : { delay: 0 }}
                  className="p-4 rounded-lg border bg-background hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm mb-1 truncate">
                        {meeting.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <CalendarIcon className="h-3 w-3 shrink-0" />
                        <span>
                          {format(new Date(meeting.date), "MMM dd, yyyy")}
                        </span>
                        <Clock className="h-3 w-3 shrink-0 ml-2" />
                        <span>{meeting.time}</span>
                      </div>
                    </div>
                    <Badge
                      variant={getStatusVariant(meeting.status)}
                      className="shrink-0 text-xs"
                    >
                      {getStatusLabel(meeting.status)}
                    </Badge>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="h-3 w-3 shrink-0" />
                      <span className="truncate">{meeting.member}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <FileText className="h-3 w-3 shrink-0" />
                      <span className="truncate">{meeting.project}</span>
                    </div>
                    {meeting.description && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {meeting.description}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

