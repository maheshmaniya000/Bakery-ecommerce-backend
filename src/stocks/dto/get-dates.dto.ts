import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

export class GetDatesDto {
	@ApiProperty()
	@IsArray()
	products: string[];
}
