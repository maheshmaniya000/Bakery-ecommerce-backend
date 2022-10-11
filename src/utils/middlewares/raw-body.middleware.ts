import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import { raw } from 'body-parser';

@Injectable()
export class RawBodyMiddleware implements NestMiddleware {
	use(req: Request, res: Response, next: () => any) {
		raw({ type: 'application/json', limit: '10mb' })(req, res, next);
	}
}
