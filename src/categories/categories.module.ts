import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Category, CategorySchema } from './schemas/category.schema';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';

import { StocksModule } from 'src/stocks/stocks.module';
import { ProductsModule } from 'src/products/products.module';
import { BundlesModule } from 'src/bundles/bundles.module';

@Module({
	imports: [
		MongooseModule.forFeatureAsync([
			{
				name: Category.name,
				useFactory: () => {
					const schema = CategorySchema;

					schema.plugin(require('mongoose-paginate-v2')); // eslint-disable-line

					return schema;
				},
			},
		]),

		StocksModule,
		forwardRef(() => BundlesModule),
		forwardRef(() => ProductsModule),
	],
	controllers: [CategoriesController],
	providers: [CategoriesService],
	exports: [CategoriesService],
})
export class CategoriesModule {}
