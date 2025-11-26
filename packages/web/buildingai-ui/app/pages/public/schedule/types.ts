import type { ScheduleMetadata } from "@buildingai/service/webapi/user-schedule";

export interface ScheduleItem {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    endTime?: string;
    startDateTime?: string;
    endDateTime?: string;
    priority: "high" | "medium" | "low" | "none";
    category: "work" | "personal" | "meeting" | "reminder" | "uncategorized";
    completed: boolean;
    isImportant?: boolean;
    isUrgent?: boolean;
    meetingAgenda?: string;
    attendees?: string;
    owner_id?: string;
    deadline?: string;
    timezone?: string;
    metadata?: ScheduleMetadata;
}

export interface AIMessage {
    id: string;
    type: "user" | "ai";
    content: string;
    timestamp: string;
}
