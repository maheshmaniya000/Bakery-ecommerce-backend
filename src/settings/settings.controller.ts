import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminGuard } from 'src/common/guards/AdminGuard';

import { UpdateDeliverySettingsDto } from './dto/update-delivery-settings.dto';
import { UpdatePeakDaySurchargeDto } from './dto/update-peak-day-surcharge.dto';
import { UpdateRestockTimeDto } from './dto/update-restock-time.dto';

import { SettingsService } from './settings.service';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
	constructor(private readonly settingsService: SettingsService) {}

	@Get('')
	async getOne() {
		return this.settingsService.getOne();
	}

	@Put('delivery')
	@UseGuards(AdminGuard)
	async updateDeliverySettings(@Body() payload: UpdateDeliverySettingsDto) {
		return this.settingsService.updateDeliverySettings(payload);
	}

	@Put('restock_time')
	@UseGuards(AdminGuard)
	async updateProductRestockTime(@Body() payload: UpdateRestockTimeDto) {
		return this.settingsService.updateRestockTime(payload);
	}

	@Put('peak_day_surcharge')
	@UseGuards(AdminGuard)
	async updatePeakDaySurcharge(@Body() payload: UpdatePeakDaySurchargeDto) {
		return this.settingsService.updatePeakDaySurcharge(payload);
	}

	@Put('min_amount_cart')
	@UseGuards(AdminGuard)
	async updateMinAmount(@Body('amount') amount: number) {
		return this.settingsService.updateMinAmountCart(amount);
	}

	@Put('free_delivery')
	@UseGuards(AdminGuard)
	async updateMinForDelivery(@Body() payload) {
		return this.settingsService.updateMinForDelivery(payload);
	}

	@Put('notify_low_stock')
	@UseGuards(AdminGuard)
	async updateNotifyLowStock(@Body('amount') amount: number) {
		return this.settingsService.updateNotifyLowStock(amount);
	}

	@Put('currently_trending')
	@UseGuards(AdminGuard)
	async updateCurrentlyTrending(@Body('products') products: string[]) {
		return this.settingsService.updateCurrentlyTrending(products);
	}

	@Get('currently_trending')
	async getCurrentlyTrending() {
		return this.settingsService.getCurrentlyTrending();
	}

	@Put('popular_items')
	@UseGuards(AdminGuard)
	updatePopularItems(@Body('products') products: string[]) {
		return this.settingsService.updatePopularItems(products);
	}

	@Get('popular_items')
	getPopularItems() {
		return this.settingsService.getPopularItems();
	}
}
