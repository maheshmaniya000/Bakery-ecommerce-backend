import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { OTPService } from './otp.service';
import { OTP, OtpSchema } from './schemas/otp.schema';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: OTP.name, schema: OtpSchema }]),
	],
	providers: [OTPService],
	exports: [OTPService],
})
export class OTPModule {}
