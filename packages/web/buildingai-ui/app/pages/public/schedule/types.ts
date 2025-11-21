export interface ScheduleItem {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    priority: "high" | "medium" | "low";
    category: "work" | "personal" | "meeting" | "reminder";
    completed: boolean;
    isImportant?: boolean;
    isUrgent?: boolean;
    meetingAgenda?: string;
    attendees?: string;
    owner_id?: string;
    deadline?: string;
}

export interface AIMessage {
    id: string;
    type: "user" | "ai";
    content: string;
    timestamp: string;
}
