import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateDeliveryZoneDto {
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
