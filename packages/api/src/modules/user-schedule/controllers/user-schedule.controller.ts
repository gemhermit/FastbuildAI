import { HttpErrorFactory } from "@buildingai/errors";
import { WebController } from "@common/decorators/controller.decorator";
import { Body, Delete, Get, Param, Patch, Post, Query, Req } from "@nestjs/common";
import type { Request } from "express";

import { ExecuteScheduleDto, ParseScheduleDto } from "../dto/ai-schedule.dto";
import { CreateUserScheduleDto } from "../dto/create-user-schedule.dto";
import { QueryUserScheduleDto } from "../dto/query-user-schedule.dto";
import { UpdateUserScheduleDto } from "../dto/update-user-schedule.dto";
import { AiScheduleService } from "../services/ai-schedule.service";
import { UserScheduleService } from "../services/user-schedule.service";

@WebController("user-schedule")
export class UserScheduleController {
    constructor(
        private readonly aiScheduleService: AiScheduleService,
        private readonly userScheduleService: UserScheduleService,
    ) {}

    @Get()
    async list(@Query() query: QueryUserScheduleDto, @Req() request: Request) {
        const userId = this.resolveUserId(request);
        const range = this.resolveRange(query);
        const items = await this.userScheduleService.findSchedulesInRange(userId, range);
        return { items };
    }

    @Post()
    async create(@Body() dto: CreateUserScheduleDto, @Req() request: Request) {
        const userId = this.resolveUserId(request);
        return this.userScheduleService.createSchedule(userId, dto);
    }

    @Post("parse")
    async parse(@Body() dto: ParseScheduleDto, @Req() request: Request) {
        const userId = this.resolveUserId(request);
        return this.aiScheduleService.parse(userId, dto);
    }

    @Post("execute")
    async execute(@Body() dto: ExecuteScheduleDto, @Req() request: Request) {
        const userId = this.resolveUserId(request);
        return this.aiScheduleService.executeIntent(userId, dto);
    }

    @Patch(":id")
    async update(
        @Param("id") scheduleId: string,
        @Body() dto: UpdateUserScheduleDto,
        @Req() request: Request,
    ) {
        const userId = this.resolveUserId(request);
        return this.userScheduleService.updateSchedule(userId, scheduleId, dto);
    }

    @Delete(":id")
    async delete(@Param("id") scheduleId: string, @Req() request: Request) {
        const userId = this.resolveUserId(request);
        await this.userScheduleService.deleteSchedule(userId, scheduleId);
        return { success: true };
    }

    private resolveUserId(request: Request): string {
        const user = request.user as { id?: string } | undefined;
        if (!user?.id) {
            throw HttpErrorFactory.unauthorized("请先登录后再使用日程助手");
        }
        return user.id;
    }

    private resolveRange(query: QueryUserScheduleDto): { start?: Date; end?: Date } {
        let start: Date | undefined;
        let end: Date | undefined;

        if (query.date) {
            const parsed = new Date(`${query.date}T00:00:00Z`);
            if (Number.isNaN(parsed.getTime())) {
                throw HttpErrorFactory.badRequest("无效的日期格式");
            }
            start = parsed;
            end = new Date(parsed.getTime() + 24 * 60 * 60 * 1000);
        }

        if (query.start) {
            start = this.parseDate(query.start, "开始时间");
        }
        if (query.end) {
            end = this.parseDate(query.end, "结束时间");
        }

        if (start && end && end < start) {
            [start, end] = [end, start];
        }

        return { start, end };
    }

    private parseDate(value: string, label: string): Date {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            throw HttpErrorFactory.badRequest(`无效的${label}`);
        }
        return date;
    }
}
