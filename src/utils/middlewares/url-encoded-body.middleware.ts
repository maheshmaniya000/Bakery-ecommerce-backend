import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import { urlencoded } from 'body-parser';

@Injectable()
export class UrlEncodedBodyMiddleware implements NestMiddleware {
	use(req: Request, res: Response, next: () => any) {
		urlencoded({
			extended: true,
		})(req, res, next);
	}
}
