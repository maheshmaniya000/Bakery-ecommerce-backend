import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateGiftTagDto {
	@ApiProperty()
	@IsString()
	readonly giftTag: string;
}
