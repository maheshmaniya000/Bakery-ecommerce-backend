import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class CheckPromoCodeDto {
	@ApiProperty()
	@IsString()
	readonly code: string;

	@ApiProperty()
	@IsNumber()
	readonly total?: number;

	readonly customerId?: string;
}
