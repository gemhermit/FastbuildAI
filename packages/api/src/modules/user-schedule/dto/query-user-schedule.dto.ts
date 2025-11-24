import { IsDateString, IsOptional, Matches } from "class-validator";

export class QueryUserScheduleDto {
    @IsOptional()
    @Matches(/^\d{4}-\d{2}-\d{2}$/)
    date?: string;

    @IsOptional()
    @IsDateString()
    start?: string;

    @IsOptional()
    @IsDateString()
    end?: string;
}
