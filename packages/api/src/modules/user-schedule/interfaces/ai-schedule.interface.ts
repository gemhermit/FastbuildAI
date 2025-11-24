import type { UserSchedule } from "@buildingai/db/entities/user-schedule.entity";

export type ScheduleIntent = "create" | "update" | "delete" | "query";

export interface ScheduleProposalPayload {
    title?: string;
    description?: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    attendees?: string;
    category?: UserSchedule["category"];
    priority?: UserSchedule["priority"];
    isImportant?: boolean;
    isUrgent?: boolean;
    timezone?: string;
}

export interface AiScheduleProposal {
    intent: ScheduleIntent;
    summary: string;
    data: ScheduleProposalPayload;
    confidence?: number;
    originalEventId?: string;
    missingFields?: string[];
    requiresClarification?: boolean;
    followUpQuestion?: string;
}

export interface AiScheduleResponse {
    reply: string;
    requiresClarification: boolean;
    followUpQuestion?: string;
    proposal?: AiScheduleProposal;
    raw?: Record<string, any>;
}

export interface ScheduleExecutionResult {
    intent: ScheduleIntent;
    message: string;
    event?: UserSchedule;
    events?: UserSchedule[];
}
