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
	Length,
} from 'class-validator';

import { PromoCodeType } from '../constants';

export class CreatePromoCodeDto {
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
	// @Length(8, 8)
	@IsString()
	promoCode: string;

	@ApiProperty()
	@IsPositive()
	@Type(() => Number)
	amount: number;

	@ApiProperty()
	@IsInt()
	@Type(() => Number)
	minSpending: number;

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

	multiCodes?: boolean;

	isOnlyAdmin: boolean;

	tags?: string[];
}
