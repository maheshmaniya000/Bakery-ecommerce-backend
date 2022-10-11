import { IsOptional, IsString } from 'class-validator';

export class GetAvailableBundlesQueryDto {
	@IsOptional()
	@IsString()
	sort?: string;

	@IsOptional()
	@IsString()
	search?: string;
}
