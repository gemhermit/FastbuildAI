import { InjectRepository } from "@buildingai/db/@nestjs/typeorm";
import { UserSchedule } from "@buildingai/db/entities/user-schedule.entity";
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from "@buildingai/db/typeorm";
import { HttpErrorFactory } from "@buildingai/errors";
import { Injectable, Logger } from "@nestjs/common";

import { CreateUserScheduleDto } from "../dto/create-user-schedule.dto";
import { UpdateUserScheduleDto } from "../dto/update-user-schedule.dto";

/**
 * 用户日程服务
 *
 * 负责CRUD及常用查询
 */
@Injectable()
export class UserScheduleService {
    private readonly logger = new Logger(UserScheduleService.name);

    constructor(
        @InjectRepository(UserSchedule)
        private readonly repository: Repository<UserSchedule>,
    ) {}

    /**
     * 创建日程
     */
    async createSchedule(userId: string, dto: CreateUserScheduleDto): Promise<UserSchedule> {
        const { startTime, endTime } = this.normalizeTimeRange(dto.startTime, dto.endTime);

        const metadata = this.mergeMetadata(undefined, {
            completed: dto.completed,
            metadata: dto.metadata,
        });

        const entity = this.repository.create({
            userId,
            title: dto.title,
            description: dto.description,
            startTime,
            endTime,
            category: dto.category ?? "work",
            priority: dto.priority ?? "medium",
            isImportant: dto.isImportant ?? false,
            isUrgent: dto.isUrgent ?? false,
            location: dto.location,
            attendees: dto.attendees,
            timezone: dto.timezone,
            metadata,
        });

        return this.repository.save(entity);
    }

    /**
     * 更新日程
     */
    async updateSchedule(
        userId: string,
        scheduleId: string,
        dto: UpdateUserScheduleDto,
    ): Promise<UserSchedule> {
        const schedule = await this.findOwnedSchedule(userId, scheduleId);

        if (dto.startTime || dto.endTime) {
            const { startTime, endTime } = this.normalizeTimeRange(
                dto.startTime ?? schedule.startTime.toISOString(),
                dto.endTime ?? schedule.endTime.toISOString(),
            );
            schedule.startTime = startTime;
            schedule.endTime = endTime;
        }

        schedule.title = dto.title ?? schedule.title;
        schedule.description = dto.description ?? schedule.description;
        schedule.category = dto.category ?? schedule.category;
        schedule.priority = dto.priority ?? schedule.priority;
        schedule.isImportant = dto.isImportant ?? schedule.isImportant;
        schedule.isUrgent = dto.isUrgent ?? schedule.isUrgent;
        schedule.location = dto.location ?? schedule.location;
        schedule.attendees = dto.attendees ?? schedule.attendees;
        schedule.timezone = dto.timezone ?? schedule.timezone;
        const metadata = this.mergeMetadata(schedule.metadata, {
            completed: dto.completed,
            metadata: dto.metadata,
        });
        if (metadata !== undefined) {
            schedule.metadata = metadata;
        }

        return this.repository.save(schedule);
    }

    /**
     * 删除日程（软删除）
     */
    async deleteSchedule(userId: string, scheduleId: string): Promise<void> {
        const schedule = await this.findOwnedSchedule(userId, scheduleId);
        await this.repository.softRemove(schedule);
    }

    /**
     * 根据 ID 查询用户日程
     */
    async findOwnedSchedule(userId: string, scheduleId: string): Promise<UserSchedule> {
        const schedule = await this.repository.findOne({
            where: { id: scheduleId, userId },
        });

        if (!schedule) {
            throw HttpErrorFactory.notFound("日程不存在或无权限访问");
        }

        return schedule;
    }

    /**
     * 查询指定时间区间内的日程
     */
    async findSchedulesInRange(
        userId: string,
        range: { start?: Date; end?: Date },
    ): Promise<UserSchedule[]> {
        const where: Record<string, any> = {
            userId,
        };

        if (range.start && range.end) {
            where.startTime = Between(range.start, range.end);
        } else if (range.start) {
            where.startTime = MoreThanOrEqual(range.start);
        } else if (range.end) {
            where.startTime = LessThanOrEqual(range.end);
        }

        return this.repository.find({
            where,
            order: { startTime: "ASC" },
        });
    }

    private mergeMetadata(
        existing: Record<string, any> | null | undefined,
        incoming: { metadata?: Record<string, any>; completed?: boolean },
    ): Record<string, any> | undefined {
        const next = { ...(existing ?? {}) };
        let changed = false;

        if (incoming.metadata) {
            Object.assign(next, incoming.metadata);
            changed = true;
        }

        if (typeof incoming.completed === "boolean") {
            next.completed = incoming.completed;
            changed = true;
        }

        if (!changed) return existing ?? undefined;

        return Object.keys(next).length ? next : undefined;
    }

    /**
     * 查询最近的几个日程，用于AI提示
     */
    async findUpcomingSchedules(userId: string, limit = 5): Promise<UserSchedule[]> {
        const now = new Date();

        return this.repository.find({
            where: {
                userId,
                startTime: MoreThanOrEqual(now),
            },
            order: { startTime: "ASC" },
            take: limit,
        });
    }

    private normalizeTimeRange(
        startInput: string,
        endInput?: string,
    ): {
        startTime: Date;
        endTime: Date;
    } {
        const startTime = new Date(startInput);
        if (Number.isNaN(startTime.getTime())) {
            throw HttpErrorFactory.badRequest("无效的开始时间");
        }

        let endTime: Date;
        if (endInput) {
            endTime = new Date(endInput);
        } else {
            endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
        }

        if (Number.isNaN(endTime.getTime())) {
            throw HttpErrorFactory.badRequest("无效的结束时间");
        }

        if (endTime <= startTime) {
            this.logger.warn(
                `结束时间早于开始时间，已自动调整：start=${startTime.toISOString()}, end=${endTime.toISOString()}`,
            );
            endTime = new Date(startTime.getTime() + 30 * 60 * 1000);
        }

        return { startTime, endTime };
    }
}
