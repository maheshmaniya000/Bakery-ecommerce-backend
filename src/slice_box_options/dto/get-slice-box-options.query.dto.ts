import { IsBooleanString, IsOptional } from 'class-validator';

export class GetSliceBoxOptionsQueryDto {
	@IsOptional()
	@IsBooleanString()
	active?: string;
}
