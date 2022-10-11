import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

export class UpdateCartDto {
	@ApiProperty()
	@IsArray()
	cart: any[];
}
