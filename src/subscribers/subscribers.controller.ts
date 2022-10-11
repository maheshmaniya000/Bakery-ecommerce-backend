import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	Param,
	Post,
	Query,
	Res,
	UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ParamDto } from 'src/utils/dto/param.dto';

import { AdminGuard } from '../common/guards/AdminGuard';

import { ExportSubscribersDto } from './dto/export-subscribers.dto';
import { GetSubscribersDto } from './dto/get-subscribers.dto';
import { SubscribeDto } from './dto/subscribe.dto';

import { SubscribersService } from './subscribers.service';

@ApiTags('Subscribers')
@Controller('subscribers')
export class SubscribersController {
	constructor(private subscribersService: SubscribersService) {}

	@Get('')
	@UseGuards(AdminGuard)
	async getList(@Query() query: GetSubscribersDto) {
		return this.subscribersService.getList(query);
	}

	@Post('export')
	@UseGuards(AdminGuard)
	async export(@Body() payload: ExportSubscribersDto, @Res() res: Response) {
		const workbook = await this.subscribersService.generateExport(payload);

		res.setHeader(
			'Content-Type',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		);
		res.setHeader(
			'Content-Disposition',
			'attachment; filename=' + 'orders.xlsx',
		);

		return workbook.xlsx.write(res).then(function () {
			res.status(200).end();
		});
	}

	@HttpCode(200)
	@Post('subscribe')
	async subscribe(@Body() { email }: SubscribeDto) {
		return {
			success: await this.subscribersService.addSubscriber(email),
		};
	}

	@UseGuards(AdminGuard)
	@Delete(':id')
	delete(@Param() { id }: ParamDto) {
		return this.subscribersService.destory(id);
	}
}
