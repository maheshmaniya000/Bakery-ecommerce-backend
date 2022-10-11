import { ApiProperty } from '@nestjs/swagger';

export class UploadCoverImageDto {
	@ApiProperty()
	readonly image: Buffer;
}
