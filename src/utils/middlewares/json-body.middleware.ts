import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import { json } from 'body-parser';

@Injectable()
export class JsonBodyMiddleware implements NestMiddleware {
	use(req: Request, res: Response, next: () => any) {
		json({
			limit: '10mb',
		})(req, res, next);
	}
}
