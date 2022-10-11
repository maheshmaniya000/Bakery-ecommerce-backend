import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
	IsBoolean,
	IsDateString,
	IsEnum,
	IsInt,
	IsOptional,
	IsPositive,
	IsString,
} from 'class-validator';

import { PromoCodeType } from '../constants';

export class UpdatePromoCodeDto {
	@ApiProperty({
		required: false,
	})
	@IsOptional()
	@IsString()
	title?: string;

	@ApiProperty({
		required: false,
	})
	@IsOptional()
	@IsString()
	description?: string;

	@ApiProperty()
	@IsPositive()
	@Type(() => Number)
	amount: number;

	@ApiProperty()
	@IsInt()
	@Type(() => Number)
	total: number;

	@ApiProperty()
	@IsEnum(PromoCodeType)
	type: PromoCodeType;

	@ApiProperty()
	@IsBoolean()
	isUnlimited: boolean;

	@ApiProperty()
	@IsBoolean()
	isOneTimePerUser: boolean;

	@ApiProperty()
	@IsBoolean()
	isIncludeDeliveryFee: boolean;

	@ApiProperty()
	@IsDateString()
	startDate: string;

	@ApiProperty({
		required: false,
	})
	@IsOptional()
	@IsDateString()
	endDate?: string;

	@ApiProperty({
		required: false,
	})
	@IsOptional()
	@IsString()
	startTime?: string;

	@ApiProperty({
		required: false,
	})
	@IsOptional()
	@IsString()
	endTime?: string;

	tags?: string[];
}
