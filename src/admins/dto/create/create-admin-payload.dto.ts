import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

import { RegisterPayloadDto } from '../../../auth/dto/register-payload.dto';

export class CreateAdminPayloadDto extends RegisterPayloadDto {
	@ApiProperty()
	@IsString()
	readonly name: string;

	@IsOptional()
	@IsBoolean()
	readonly isSuper?: boolean;

	@IsOptional()
	@IsString()
	readonly mobileNo?: string;
}
