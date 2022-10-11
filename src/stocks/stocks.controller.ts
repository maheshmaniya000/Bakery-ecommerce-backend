import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminGuard } from 'src/common/guards/AdminGuard';
import { ParamDto } from 'src/utils/dto/param.dto';
import { NotifyUpdateStockDto } from './dto/notify-update-stock.dto';

import { StocksService } from './stocks.service';

@ApiTags('stocks')
@Controller('stocks')
export class StocksController {
	constructor(private readonly stocksService: StocksService) {}

	@Get('notify_low_stock')
	@UseGuards(AdminGuard)
	async getNotifyLowtStocks() {
		return this.stocksService.getNotifyLowStocks();
	}

	@Put(':id')
	@UseGuards(AdminGuard)
	async updateStock(
		@Param() { id }: ParamDto,
		@Body() payload: NotifyUpdateStockDto,
	) {
		return this.stocksService.updateNotifyStocks(id, payload);
	}
}
