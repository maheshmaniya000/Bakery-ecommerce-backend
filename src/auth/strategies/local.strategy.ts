import { BadRequestException, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { Request } from 'express';

import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
	constructor(private readonly authService: AuthService) {
		super({
			usernameField: 'email',
			passReqToCallback: true,
		});
	}

	async validate(req: Request): Promise<any> {
		const { type, email, password } = req.body;

		if (!type) {
			throw new BadRequestException('something is missing');
		}

		const user = await this.authService.validateUser(email, password, type);

		if (!user) {
			return null;
		}

		return user;
	}
}
