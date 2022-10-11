import { IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ParamDto {
	@ApiProperty()
	@IsMongoId()
	id: string;
}
