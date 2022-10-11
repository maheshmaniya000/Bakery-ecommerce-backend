import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Product, ProductSchema } from './schemas/product.schema';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';

import { SettingsModule } from '../settings/settings.module';
import { CategoriesModule } from '../categories/categories.module';
import { StocksModule } from '../stocks/stocks.module';
import { OrdersModule } from 'src/orders/orders.module';

@Module({
	imports: [
		MongooseModule.forFeatureAsync([
			{
				imports: [StocksModule],

				name: Product.name,
				useFactory: () => {
					const schema = ProductSchema;

					schema.plugin(require('mongoose-paginate-v2')); // eslint-disable-line

					return schema;
				},
			},
		]),

		SettingsModule,

		forwardRef(() => CategoriesModule),
		forwardRef(() => StocksModule),
		forwardRef(() => OrdersModule),
	],
	controllers: [ProductsController],
	providers: [ProductsService],
	exports: [ProductsService],
})
export class ProductsModule {}
