import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ProductsModule } from 'src/products/products.module';
import { StocksModule } from 'src/stocks/stocks.module';

import {
	BundleProduct,
	BundleProductSchema,
} from './schemas/bundle-product.schema';
import { Bundle, BundleSchema } from './schemas/bundle.schema';

import { BundleProductService } from './services/bundle-product.service';
import { BundlesService } from './bundles.service';
import { BundleService } from './services/bundle.service';

import { BundlesController } from './bundles.controller';

@Module({
	imports: [
		MongooseModule.forFeatureAsync([
			{ name: BundleProduct.name, useFactory: () => BundleProductSchema },
			{
				name: Bundle.name,
				useFactory: () => {
					const schema = BundleSchema;

					schema.plugin(require('mongoose-paginate-v2')); // eslint-disable-line

					return schema;
				},
			},
		]),

		forwardRef(() => ProductsModule),
		StocksModule,
	],
	controllers: [BundlesController],
	providers: [BundleProductService, BundleService, BundlesService],
	exports: [BundlesService],
})
export class BundlesModule {}
