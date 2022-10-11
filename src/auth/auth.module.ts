import { forwardRef, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AccountsModule } from '../accounts/accounts.module';
import { AdminsModule } from '../admins/admins.module';
import { CustomersModule } from '../customers/customers.module';
import { OrdersModule } from '../orders/orders.module';
import { OTPModule } from '../otp/otp.module';
import { ValidatedEmailsModule } from 'src/validated_emails/validated_emails.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
	imports: [
		AccountsModule,
		OTPModule,
		ValidatedEmailsModule,
		forwardRef(() => AdminsModule),
		forwardRef(() => CustomersModule),
		forwardRef(() => OrdersModule),

		PassportModule.register({ defaultStrategy: 'jwt' }),
		JwtModule.registerAsync({
			inject: [ConfigService],

			useFactory: async (
				configService: ConfigService,
			): Promise<JwtModuleOptions> => ({
				secret: configService.get<string>('jwt.secret'),
				signOptions: {
					expiresIn: configService.get<string>('jwt.expiresIn'),
				},
			}),
		}),
	],
	controllers: [AuthController],
	providers: [AuthService, LocalStrategy, JwtStrategy],
	exports: [AuthService],
})
export class AuthModule {}
