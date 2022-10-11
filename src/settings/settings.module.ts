import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Setting, SettingSchema } from './schemas/setting.schema';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';

import { StocksModule } from 'src/stocks/stocks.module';

@Module({
	imports: [
		forwardRef(() => StocksModule),

		MongooseModule.forFeature([
			{ name: Setting.name, schema: SettingSchema },
		]),
	],
	controllers: [SettingsController],
	providers: [SettingsService],
	exports: [SettingsService],
})
export class SettingsModule {}
