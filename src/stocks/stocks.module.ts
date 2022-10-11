import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Stock, StockSchema } from './schemas/stock.schema';
import { StockLogs, StockLogsSchema } from './schemas/stock_logs.schema';
import { StocksService } from './stocks.service';
import { StocksController } from './stocks.controller';

import { SettingsModule } from '../settings/settings.module';
import { ProductsModule } from 'src/products/products.module';

import { StockLogsService } from './services/stock_logs.service';

@Module({
	imports: [
		MongooseModule.forFeatureAsync([
			{
				name: Stock.name,
				useFactory: () => StockSchema,
			},
			{
				name: StockLogs.name,
				useFactory: () => StockLogsSchema,
			},
		]),

		forwardRef(() => SettingsModule),
		forwardRef(() => ProductsModule),
	],
	controllers: [StocksController],
	providers: [StocksService, StockLogsService],
	exports: [StocksService],
})
export class StocksModule {}
