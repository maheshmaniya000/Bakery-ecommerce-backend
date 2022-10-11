import { Type } from 'class-transformer';
import { IsArray, IsNumber } from 'class-validator';

export class UpdatePeakDaySurchargeDto {
	@IsNumber()
	@Type(() => Number)
	price: number;

	@IsArray()
	dates: string[];
}
