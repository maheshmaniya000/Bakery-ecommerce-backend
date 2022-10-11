import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

export class UpdateHomeCarouselDto {
	@ApiProperty()
	@IsArray()
	readonly images: string[];
}
