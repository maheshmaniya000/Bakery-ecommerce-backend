import { IsString, MinLength } from 'class-validator';

export class SetPasswordDto {
	@IsString()
	@MinLength(8)
	readonly password: string;
}
