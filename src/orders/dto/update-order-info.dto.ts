import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateOrderInfoDto {
	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	readonly remark?: string;

	@ApiProperty({
		type: [String],
	})
	@IsOptional()
	@IsArray()
	readonly tags: string[];
}
