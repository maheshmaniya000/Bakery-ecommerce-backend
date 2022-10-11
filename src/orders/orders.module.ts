import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Order, OrderSchema } from './schemas/order.schema';
import { BackupOrder, BackupOrderSchema } from './schemas/backup-order.schema';
import {
	OrderBundle,
	OrderBundleSchema,
} from './schemas/order-bundle/order-bundle.schema';
import {
	OrderBundleProduct,
	OrderBundleProductSchema,
} from './schemas/order-bundle/order-bundle-product.schema';

import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PackingSlipService } from './packing-slip.service';
import { BackupOrderService } from './services/backup-order.service';
import { ProductSoldsService } from './product-solds.service';
import { OrderSchedulerService } from './services/order-scheduler.service';
import { OrderUtilsService } from './services/order-utils.service';
import { OrderBundleService } from './services/order-bundle/order-bundle.service';
import { OrderBundleProductService } from './services/order-bundle/order-bundle-product.service';
import { OrderReportsService } from './services/orer-reports.service';

import { CustomersModule } from '../customers/customers.module';
import { ProductsModule } from '../products/products.module';
import { CategoriesModule } from '../categories/categories.module';
import { OutskirtsModule } from '../outskirts/outskirts.module';
import { DeliveryMethodsModule } from '../delivery_methods/delivery_methods.module';
import { DeliveryZonesModule } from '../delivery_zones/delivery_zones.module';
import { StocksModule } from '../stocks/stocks.module';
import { StripeModule } from '../stripe/stripe.module';
import { HitpayModule } from '../hitpay/hitpay.module';
import { SettingsModule } from '../settings/settings.module';
import { PromoCodesModule } from '../promo_codes/promo_codes.module';
import { ReportsModule } from 'src/reports/reports.module';
import { SliceBoxesModule } from 'src/slice_boxes/slice_boxes.module';
import { ValidatedEmailsModule } from 'src/validated_emails/validated_emails.module';
import { BundlesModule } from 'src/bundles/bundles.module';

@Module({
	imports: [
		forwardRef(() => CustomersModule),
		forwardRef(() => PromoCodesModule),
		forwardRef(() => ProductsModule),
		CategoriesModule,
		DeliveryMethodsModule,
		DeliveryZonesModule,
		OutskirtsModule,
		StocksModule,
		StripeModule,
		HitpayModule,
		SettingsModule,
		SliceBoxesModule,
		ValidatedEmailsModule,
		BundlesModule,

		ReportsModule,

		MongooseModule.forFeatureAsync([
			{
				name: Order.name,
				useFactory: () => {
					const schema = OrderSchema;

					schema.plugin(require('mongoose-paginate-v2')); // eslint-disable-line

					return schema;
				},
			},
			{
				name: BackupOrder.name,
				useFactory: () => {
					const schema = BackupOrderSchema;

					schema.plugin(require('mongoose-paginate-v2')); // eslint-disable-line

					return schema;
				},
			},
			{
				name: OrderBundle.name,
				useFactory: () => OrderBundleSchema,
			},
			{
				name: OrderBundleProduct.name,
				useFactory: () => OrderBundleProductSchema,
			},
		]),
	],
	controllers: [OrdersController],
	providers: [
		OrdersService,
		OrderUtilsService,
		OrderReportsService,
		OrderSchedulerService,
		OrderBundleService,
		OrderBundleProductService,
		BackupOrderService,
		PackingSlipService,
		ProductSoldsService,
	],
	exports: [OrdersService],
})
export class OrdersModule {}
