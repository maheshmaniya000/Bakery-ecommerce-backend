import {
	Controller,
	Post,
	UseGuards,
	Request,
	Body,
	Get,
	Query,
	Put,
	Delete,
	Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { FacebookLoginDto } from './dto/facebook-login.dto';
import { GoogleLoginDto } from './dto/google-login.dto';

import { LoginPayloadDto } from './dto/login-payload.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { PaginationDto } from '../utils/dto/pagination.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { CheckOtpDto } from './dto/check-otp.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ParamDto } from 'src/utils/dto/param.dto';
import { SendResetPasswordDto } from './dto/send-reset-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AccountType } from 'src/accounts/constants';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@UseGuards(AuthGuard('local'))
	@Post('login')
	async login(@Body() payload: LoginPayloadDto, @Request() req) {
		return {
			accessToken: await this.authService.generateAuthToken(req.user),
		};
	}

	@Post('oauth/google')
	async googleLogin(@Body() payload: GoogleLoginDto) {
		return {
			accessToken: await this.authService.googleLogin(payload),
		};
	}

	@Post('oauth/facebook')
	async facebookLogin(@Body() payload: FacebookLoginDto) {
		return {
			accessToken: await this.authService.facebookLogin(payload),
		};
	}

	@Post('send_otp')
	async sendOtp(@Body() { email }: SendOtpDto) {
		await this.authService.sendOtp(email);

		return true;
	}

	@Post('check_otp')
	async checkOtp(@Body() { email, otp }: CheckOtpDto) {
		return {
			valid: await this.authService.checkOtp(email, otp),
		};
	}

	@Post('send-reset-password')
	async sendResetPassword(@Body() { email }: SendResetPasswordDto) {
		await this.authService.sendResetPassword(email, AccountType.CUSTOMER);

		return 'success';
	}

	@Post('send-reset-password/admin')
	async sendAdminResetPassword(@Body() { email }: SendResetPasswordDto) {
		await this.authService.sendResetPassword(email, AccountType.ADMIN);

		return 'success';
	}

	@Post('reset-password')
	async resetPassword(@Body() { token, password }: ResetPasswordDto) {
		await this.authService.resetPassword(token, password);

		return 'success';
	}

	@UseGuards(AuthGuard('jwt'))
	@Get('me')
	async getProfile(@Request() req) {
		return req.user;
	}

	@UseGuards(AuthGuard('jwt'))
	@Post('me/cart')
	async updateCart(@Request() req, @Body() { cart }: UpdateCartDto) {
		return this.authService.updateCart(req.user, cart);
	}

	@UseGuards(AuthGuard('jwt'))
	@Put('me')
	async updateProifle(@Request() req, @Body() payload: UpdateProfileDto) {
		return this.authService.updateProfile(req.user, payload);
	}

	@UseGuards(AuthGuard('jwt'))
	@Post('me/link_facebook')
	async linkWithFacebook(@Request() req, @Body() payload: FacebookLoginDto) {
		return this.authService.linkWithFacebook(req.user, payload);
	}

	@UseGuards(AuthGuard('jwt'))
	@Post('me/link_google')
	async linkWithGoogle(@Request() req, @Body() payload: GoogleLoginDto) {
		return this.authService.linkWithGoogle(req.user, payload);
	}

	@UseGuards(AuthGuard('jwt'))
	@Put('me/set_password')
	async setPassword(@Request() req, @Body() payload: SetPasswordDto) {
		return this.authService.setPassword(req.user, payload.password);
	}

	@UseGuards(AuthGuard('jwt'))
	@Put('me/change_password')
	async changePassword(@Request() req, @Body() payload: ChangePasswordDto) {
		return this.authService.changePassword(req.user, payload);
	}

	@UseGuards(AuthGuard('jwt'))
	@Get('me/orders')
	async getOrders(
		@Request() req,
		@Query() { page = 1, limit = 10 }: PaginationDto,
	) {
		return this.authService.getOrders(req.user._id, { page, limit });
	}

	@UseGuards(AuthGuard('jwt'))
	@Delete('me/:id/accounts')
	async deleteAccount(@Param() { id }: ParamDto) {
		return this.authService.deleteAccount(id);
	}
}
