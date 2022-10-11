import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ProductsModule } from 'src/products/products.module';
import { SliceBoxOptionsModule } from 'src/slice_box_options/slice_box_options.module';

import { SliceBox, SliceBoxSchema } from './schemas/slice_box.schema';
import {
	SliceBoxProduct,
	SliceBoxProductSchema,
} from './schemas/slice_box_product.schema';

import { SliceBoxService } from './services/slice_box.service';
import { SliceBoxProductSerivce } from './services/slice_box_product.service';
import { SliceBoxesService } from './slice_boxes.service';

@Module({
	imports: [
		ProductsModule,
		SliceBoxOptionsModule,

		MongooseModule.forFeature([
			{ name: SliceBoxProduct.name, schema: SliceBoxProductSchema },
			{ name: SliceBox.name, schema: SliceBoxSchema },
		]),
	],
	providers: [SliceBoxProductSerivce, SliceBoxService, SliceBoxesService],
	exports: [SliceBoxesService],
})
export class SliceBoxesModule {}
