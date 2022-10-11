import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateDeliveryZoneDto {
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
		type: [String],
	})
	@IsArray()
	readonly postalCodes: string[];
}
