import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
	IsArray,
	IsBoolean,
	IsEnum,
	IsNumber,
	IsOptional,
	IsString,
	ValidateIf,
	ValidateNested,
} from 'class-validator';

import { DeliveryMethodEmail, DeliveryMethodType } from '../constants';
import { CreateDeliveryTimeDto } from './create_delivery_method_time.dto';
import { DeliveryTimeSlotDto } from './delivery_time_slot.dto';

export class CreateDeliveryMethodDto {
	@ApiProperty()
	@IsString()
	readonly name: string;

	@ApiProperty({
		required: false,
	})
	@IsOptional()
	@IsString()
	readonly description?: string;

	@ApiProperty({
		required: false,
	})
	@IsOptional()
	@IsString()
	readonly icon?: string;

	@ApiProperty()
	@IsBoolean()
	readonly needPostalCode: boolean;

	@ApiProperty()
	@IsBoolean()
	readonly isOutskirt: boolean;

	@ApiProperty()
	@IsNumber()
	@Type(() => Number)
	readonly deliveryPrice: number;

	@ApiProperty({
		required: false,
	})
	@ValidateIf(({ isOutskirt }) => isOutskirt === true)
	@IsNumber()
	@Type(() => Number)
	readonly outskirtPrice?: number;

	@ApiProperty({
		type: [DeliveryTimeSlotDto],
	})
	@IsArray()
	@ValidateNested({ each: true })
	readonly specificTimes: DeliveryTimeSlotDto[];

	@ApiProperty()
	@IsEnum(DeliveryMethodType, {
		message:
			'$property must be one of ' +
			Object.values(DeliveryMethodType).join(', ') +
			'.',
	})
	readonly type: DeliveryMethodType;

	@IsEnum(DeliveryMethodEmail)
	emailType: DeliveryMethodEmail;

	times: CreateDeliveryTimeDto[];
}
