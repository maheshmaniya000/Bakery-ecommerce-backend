import {
	ExecutionContext,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { AccountType } from '../../accounts/constants';

@Injectable()
export class AdminGuard extends AuthGuard('jwt') {
	canActivate(context: ExecutionContext) {
		return super.canActivate(context);
	}

	handleRequest(err, user) {
		if (err || !user) {
			throw err || new UnauthorizedException();
		} else if (user.auth.accountType !== AccountType.ADMIN) {
			throw new UnauthorizedException();
		}

		return user;
	}
}
