import { IsOptional, IsString } from 'class-validator';

export class UpdateAdminPayloadDto {
	@IsString()
	name: string;

	@IsOptional()
	@IsString()
	mobileNo?: string;
}
