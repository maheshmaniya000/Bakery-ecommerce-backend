import {
	Body,
	Controller,
	Get,
	HttpCode,
	Param,
	Post,
	Put,
	Query,
	Req,
	Res,
	UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';

import { CreateOrderDto } from './dto/create-order.dto';
import { CreateAdhocOrderDto } from './dto/create-adhoc-order.dto';
import { GetOrdersQueryDto } from './dto/get-orders-query.dto';
import { ParamDto } from '../utils/dto/param.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderInfoDto } from './dto/update-order-info.dto';
import { CalcSummaryDto } from './dto/calc-summary.dto';
import { UpdateGiftTagDto } from './dto/update-gift-tag-dto';
import { ExportOrdersDto } from './dto/export-orders.dto';

import { OrdersService } from './orders.service';

import { AdminGuard } from '../common/guards/AdminGuard';
import { UpdateSpecialInfo } from './dto/update-special-info.dto';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
	constructor(private readonly ordersService: OrdersService) {}

	@Get('')
	async getList(
		@Query() { page = 1, limit = 10, ...query }: GetOrdersQueryDto,
	) {
		return this.ordersService.getList({ page, limit, ...query });
	}

	@Get('latest')
	@UseGuards(AdminGuard)
	getLatest() {
		return this.ordersService.getByLatestOrderDate();
	}

	@Post('')
	async create(@Body() payload: CreateOrderDto) {
		return this.ordersService.createOrder(payload);
	}

	@Post('custom_export')
	@ApiBearerAuth()
	@UseGuards(AdminGuard)
	async customExport(
		@Query() query: GetOrdersQueryDto,
		@Res() res: Response,
	) {
		const workbook = await this.ordersService.customExportExcel(query);

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

	@Post('calc_summary')
	async calcSummary(@Body() payload: CalcSummaryDto) {
		return this.ordersService.calcSummary(payload);
	}

	@Post('get-deliverable-dates')
	getDeliverableDates(@Body() payload: CalcSummaryDto) {
		return this.ordersService.getDeliverableDates(payload);
	}

	@Post('calc_deliveryFee')
	async calcDeliveryFee(@Body() { deliveryMethodId, timeId, postalCode }) {
		return this.ordersService.getDeliveryFee(
			deliveryMethodId,
			timeId,
			postalCode,
		);
	}

	@Post('packing_slip')
	@ApiBearerAuth()
	@UseGuards(AdminGuard)
	async getPackingSlip(
		@Body() { startDate, endDate }: ExportOrdersDto,
		@Res() res: Response,
	) {
		const doc = await this.ordersService.generatePackingSlip(
			startDate,
			endDate,
		);

		res.setHeader('Content-Type', 'application/pdf');
		res.setHeader(
			'Content-Disposition',
			'attachment; filename=packing-slip.pdf',
		);

		doc.pipe(res);

		doc.end();
	}

	@Get('dashboard')
	@UseGuards(AdminGuard)
	async getDashboard(@Query('starter') starter?: string) {
		return this.ordersService.getCountsOfOrders(14, starter);
	}

	@Post('adhoc')
	@ApiBearerAuth()
	@UseGuards(AdminGuard)
	async createAdhoc(@Req() req, @Body() payload: CreateAdhocOrderDto) {
		return this.ordersService.createAdhocOrder(
			payload,
			req.user.auth.accountType,
		);
	}

	@Post('export')
	@ApiBearerAuth()
	@UseGuards(AdminGuard)
	async exportExcel(@Body() payload: ExportOrdersDto, @Res() res: Response) {
		const workbook = await this.ordersService.generateExcel(payload);

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

	@Post('stripe/webhook')
	@HttpCode(200)
	async stripeUpdate(@Req() request: Request) {
		await this.ordersService.processStripeWebhook(request);

		return {
			status: 'received',
		};
	}

	@Post('hitpay/webhook')
	@HttpCode(200)
	async hitpayUpdate(@Body() data) {
		await this.ordersService.processHitpayWebhook(data);

		return {
			status: 'received',
		};
	}

	@Get('tags')
	@UseGuards(AdminGuard)
	async getTags() {
		return this.ordersService.getTags();
	}

	@Put('status')
	@UseGuards(AuthGuard('jwt'))
	async updateStatus(@Body() { ids, status }) {
		return this.ordersService.updateStatus(ids, status);
	}

	@Get('intents/:id')
	getIntentDate(@Param('id') id: string) {
		return this.ordersService.getIntentData(id);
	}

	@Get(':id')
	async getDetail(@Param() { id }: ParamDto) {
		return this.ordersService.getDetail(id);
	}

	@Put(':id')
	async update(@Param() { id }: ParamDto, @Body() payload: UpdateOrderDto) {
		return this.ordersService.updateOrder(id, payload);
	}

	@Put(':id/special_info')
	async updateSpecialInfo(
		@Param() { id }: ParamDto,
		@Body() payload: UpdateSpecialInfo,
	) {
		return this.ordersService.updateSpeicalInfo(id, payload);
	}

	@Put(':id/admin')
	@UseGuards(AdminGuard)
	async updateByAdmin(
		@Param() { id }: ParamDto,
		@Body() payload: UpdateOrderDto,
	) {
		return this.ordersService.updateOrderByAdmin(id, payload);
	}

	@Post(':id/resend')
	@UseGuards(AdminGuard)
	async resendEmail(@Param() { id }: ParamDto) {
		return this.ordersService.sendEmail(id);
	}

	@Put(':id/gift_tag')
	async updateGiftTag(
		@Param() { id }: ParamDto,
		@Body() payload: UpdateGiftTagDto,
	) {
		return this.ordersService.updateGiftTag(id, payload);
	}

	@Put(':id/instruction')
	async updateInstruction(
		@Param() { id }: ParamDto,
		@Body('note') note: string,
	) {
		return this.ordersService.updateInstruction(id, note);
	}

	@Get(':id/stripe')
	async getStripeSession(@Param() { id }: ParamDto) {
		return this.ordersService.getStripeSession(id);
	}

	@Get(':id/hitpay')
	async getHitpaySession(@Param() { id }: ParamDto) {
		return this.ordersService.getHitpaySession(id);
	}

	@Post(':id/cancelled')
	@HttpCode(200)
	@ApiBearerAuth()
	@UseGuards(AdminGuard)
	async cancelOrder(@Param() { id }: ParamDto, @Body('refund') refundAmount) {
		return this.ordersService.cancelOrder(id, parseFloat(refundAmount));
	}

	@Post(':id/refund')
	@HttpCode(200)
	@ApiBearerAuth()
	@UseGuards(AdminGuard)
	async refundOrder(@Param() { id }: ParamDto, @Body('refund') refundAmount) {
		return this.ordersService.refundOrder(id, parseFloat(refundAmount));
	}

	@Put(':id/info')
	@ApiBearerAuth()
	@UseGuards(AuthGuard('jwt'))
	async updateInfo(
		@Param() { id }: ParamDto,
		@Body() payload: UpdateOrderInfoDto,
	) {
		return this.ordersService.updateOrderInfo(id, payload);
	}
}
