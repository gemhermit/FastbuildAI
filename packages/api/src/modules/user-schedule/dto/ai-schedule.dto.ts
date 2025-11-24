import {
    IsBoolean,
    IsDateString,
    IsIn,
    IsObject,
    IsOptional,
    IsString,
    IsUUID,
    ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

import type { ScheduleIntent } from "../interfaces/ai-schedule.interface";

export class ParseScheduleDto {
    @IsString()
    message: string;

    @IsOptional()
    @IsString()
    timezone?: string;

    @IsOptional()
    @IsUUID()
    modelId?: string;

    @IsOptional()
    @IsDateString()
    now?: string;
}

const SCHEDULE_INTENTS = ["create", "update", "delete", "query"] as const;

export class SchedulePayloadDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsDateString()
    startTime?: string;

    @IsOptional()
    @IsDateString()
    endTime?: string;

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsString()
    attendees?: string;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsString()
    priority?: string;

    @IsOptional()
    @IsBoolean()
    isImportant?: boolean;

    @IsOptional()
    @IsBoolean()
    isUrgent?: boolean;

    @IsOptional()
    @IsString()
    timezone?: string;
}

export class ExecuteScheduleDto {
    @IsIn(SCHEDULE_INTENTS)
    intent: ScheduleIntent;

    @IsOptional()
    @IsUUID()
    scheduleId?: string;

    @IsOptional()
    @IsString()
    summary?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => SchedulePayloadDto)
    data?: SchedulePayloadDto;

    @IsOptional()
    @IsObject()
    context?: Record<string, any>;
}
