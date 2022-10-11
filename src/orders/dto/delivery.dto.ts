import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class DeliveryDto {
	@ApiProperty()
	@IsMongoId()
	methodId: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsMongoId()
	specificId?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	postalCode?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	address: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	buildingUnitNo: string;
}
