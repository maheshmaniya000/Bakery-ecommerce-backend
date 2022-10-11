import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateRestockTimeDto {
	@ApiProperty()
	@IsString()
	restockTime: string;
}
