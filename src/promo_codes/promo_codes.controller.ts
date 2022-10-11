import {
	Body,
	Controller,
	Get,
	Param,
	Post,
	Put,
	Request,
	Query,
	Res,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';

import { AdminGuard } from '../common/guards/AdminGuard';

import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { UpdatePromoCodeDto } from './dto/update-promo-code.dto';
import { ParamDto } from '../utils/dto/param.dto';
import { GetPromoCodeQueryDto } from './dto/get-promo-codes.query.dto';
import { CheckPromoCodeDto } from './dto/check-promo-code.dto';

import { PromoCodesService } from './promo_codes.service';

@ApiTags('Promo Codes')
@Controller('promo_codes')
export class PromoCodesController {
	constructor(private promoCodesService: PromoCodesService) {}

	@Get('')
	@ApiBearerAuth()
	@UseGuards(AdminGuard)
	async getList(@Query() query: GetPromoCodeQueryDto) {
		return this.promoCodesService.getList(query);
	}

	@Post('')
	@ApiBearerAuth()
	@UseGuards(AdminGuard)
	async create(@Body() payload: CreatePromoCodeDto) {
		return this.promoCodesService.create(payload);
	}

	@Post('check')
	@UseGuards(AuthGuard('jwt'))
	async check(
		@Request() req,
		@Body() { code, total, customerId }: CheckPromoCodeDto,
	) {
		return this.promoCodesService.isValid(
			code,
			total,
			customerId || req.user._id,
			req.user.auth.accountType, // loggedInAccountType
		);
	}

	@Get('tags')
	@UseGuards(AdminGuard)
	async getTags() {
		return this.promoCodesService.getTags();
	}

	@Get(':id')
	@ApiBearerAuth()
	@UseGuards(AdminGuard)
	async get(@Param() { id }: ParamDto) {
		return this.promoCodesService.getDetail(id);
	}

	@Put(':id')
	@ApiBearerAuth()
	@UseGuards(AdminGuard)
	async update(
		@Param() { id }: ParamDto,
		@Body() payload: UpdatePromoCodeDto,
	) {
		return this.promoCodesService.update(id, payload);
	}

	@Get(':id/codes')
	@UseGuards(AdminGuard)
	async getCodes(@Param() { id }: ParamDto) {
		return this.promoCodesService.getCodesWithCustomer(id);
	}

	@Post(':id/codes/export')
	@UseGuards(AdminGuard)
	async exportCodes(@Param() { id }: ParamDto, @Res() res: Response) {
		const workbook = await this.promoCodesService.exportPromoCodes(id);

		res.setHeader(
			'Content-Type',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		);
		res.setHeader(
			'Content-Disposition',
			'attachment; filename=' + 'promocodes.xlsx',
		);

		return workbook.xlsx.write(res).then(function () {
			res.status(200).end();
		});
	}

	@ApiBearerAuth()
	@Put(':id/status')
	@UseGuards(AdminGuard)
	updateStatus(@Param() { id }: ParamDto, @Body('status') status: boolean) {
		return this.promoCodesService.updateStatus(id, status);
	}
}
