import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class RestockDto {
	@ApiProperty()
	@IsString()
	readonly size: string;

	@ApiProperty()
	@IsNumber()
	readonly price: number;
}
