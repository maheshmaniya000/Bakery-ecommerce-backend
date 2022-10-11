import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { DeliveryTimeSlot } from '../constants';

export class DeliveryTimeSlotDto implements DeliveryTimeSlot {
	@ApiProperty()
	@IsString()
	readonly startTime: string;

	@ApiProperty()
	@IsString()
	readonly endTime: string;
}
