import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsString } from 'class-validator';

export class UpdateDeliverySettingsDto {
	@ApiProperty()
	@IsNumber()
	@Type(() => Number)
	readonly preparationDays: number;

	@ApiProperty()
	@IsNumber()
	@Type(() => Number)
	readonly deliveryDays: number;

	@ApiProperty()
	@IsArray()
	readonly blackoutDates: string[];

	@ApiProperty()
	@IsString()
	readonly deliveryNextDayTime: string;

	blackOutDay: number;
}
