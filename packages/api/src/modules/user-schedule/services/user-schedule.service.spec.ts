import { UserSchedule } from "@buildingai/db/entities/user-schedule.entity";
import { Repository } from "@buildingai/db/typeorm";

import { CreateUserScheduleDto } from "../dto/create-user-schedule.dto";
import { UserScheduleService } from "./user-schedule.service";

jest.mock("callsites", () => {
    return () => [];
});

describe("UserScheduleService", () => {
    let service: UserScheduleService;
    let repository: jest.Mocked<Repository<UserSchedule>>;

    beforeEach(() => {
        repository = {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            softRemove: jest.fn(),
            find: jest.fn(),
        } as any;

        service = new UserScheduleService(repository);
    });

    it("creates schedule with default values", async () => {
        const dto: CreateUserScheduleDto = {
            title: "Demo",
            startTime: "2024-01-01T00:00:00.000Z",
        };

        const created: UserSchedule = {
            id: "1",
            ...dto,
            startTime: new Date(dto.startTime),
            endTime: new Date("2024-01-01T01:00:00.000Z"),
            category: "work",
            priority: "medium",
            isImportant: false,
            isUrgent: false,
            userId: "u",
            createdAt: new Date(),
            updatedAt: new Date(),
        } as any;

        repository.create.mockReturnValue(created);
        repository.save.mockResolvedValue(created);

        const result = await service.createSchedule("u", dto);

        expect(repository.create).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: "u",
                category: "work",
                priority: "medium",
                isImportant: false,
                isUrgent: false,
            }),
        );
        expect(result).toBe(created);
    });

    it("throws when schedule not found", async () => {
        repository.findOne.mockResolvedValue(null);
        await expect(service.findOwnedSchedule("u", "missing")).rejects.toThrow("日程不存在");
    });

    it("deletes schedule via soft remove", async () => {
        const schedule = { id: "1" } as UserSchedule;
        repository.findOne.mockResolvedValue(schedule);
        repository.softRemove.mockResolvedValue(schedule);

        await service.deleteSchedule("u", "1");
        expect(repository.softRemove).toHaveBeenCalledWith(schedule);
    });
});
