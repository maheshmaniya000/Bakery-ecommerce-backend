import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

export class SubscribeDto {
    @ApiProperty()
    @IsEmail()
    email: string;
}