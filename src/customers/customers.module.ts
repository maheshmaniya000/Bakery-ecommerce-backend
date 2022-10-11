import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Customer, CustomerSchema } from './schemas/customer.schema';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';

import { AuthModule } from '../auth/auth.module';
import { OrdersModule } from '../orders/orders.module';
import { AccountsModule } from '../accounts/accounts.module';
import { ProductsModule } from 'src/products/products.module';

@Module({
	imports: [
		forwardRef(() => AuthModule),
		forwardRef(() => OrdersModule),
		AccountsModule,
		ProductsModule,

		MongooseModule.forFeatureAsync([
			{
				name: Customer.name,
				useFactory: () => {
					const schema = CustomerSchema;

					schema.plugin(require('mongoose-paginate-v2')); // eslint-disable-line

					return schema;
				},
			},
		]),
	],
	controllers: [CustomersController],
	providers: [CustomersService],
	exports: [CustomersService],
})
export class CustomersModule {}
