import { Type } from 'class-transformer';
import { IsOptional, IsPositive } from 'class-validator';

export class GetDeliverableDatesQueryDto {
	@IsOptional()
	@IsPositive()
	@Type(() => Number)
	qty?: number;
}
