import {
	MiddlewareConsumer,
	Module,
	NestModule,
	RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import configuration from './config/configuration';

import { DatabaseModule } from './database/database.module';
import { AccountsModule } from './accounts/accounts.module';
import { AuthModule } from './auth/auth.module';
import { AdminsModule } from './admins/admins.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { SettingsModule } from './settings/settings.module';
import { AWSModule } from './aws/aws.module';
import { DeliveryMethodsModule } from './delivery_methods/delivery_methods.module';
import { OutskirtsModule } from './outskirts/outskirts.module';
import { DeliveryZonesModule } from './delivery_zones/delivery_zones.module';
import { OrdersModule } from './orders/orders.module';
import { CustomersModule } from './customers/customers.module';
import { ContentsModule } from './contents/contents.module';
import { StripeModule } from './stripe/stripe.module';
import { HitpayModule } from './hitpay/hitpay.module';
import { PromoCodesModule } from './promo_codes/promo_codes.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { SubscribersModule } from './subscribers/subscribers.module';
import { MailModule } from './mail/mail.module';
import { OTPModule } from './otp/otp.module';
import { SliceBoxOptionsModule } from './slice_box_options/slice_box_options.module';
import { SliceBoxesModule } from './slice_boxes/slice_boxes.module';
import { MailGunModule } from './mailgun/mailgun.module';
import { BundlesModule } from './bundles/bundles.module';
import { ValidatedEmailsModule } from './validated_emails/validated_emails.module';

import { ContactUsModule } from './contact_us/contact_us.module';
import { ArticlesModule } from './articles/articles.module';
import { ReportsService } from './reports/reports.service';

import { RawBodyMiddleware } from './utils/middlewares/raw-body.middleware';
import { JsonBodyMiddleware } from './utils/middlewares/json-body.middleware';
import { UrlEncodedBodyMiddleware } from './utils/middlewares/url-encoded-body.middleware';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [configuration],
		}),
		ScheduleModule.forRoot(),
		EventEmitterModule.forRoot({
			delimiter: '.',
		}),
		TerminusModule,
		AWSModule,
		StripeModule,
		HitpayModule,
		MailModule,
		OTPModule,
		ReportsService,

		DatabaseModule,
		AccountsModule,
		AuthModule,
		AdminsModule,
		CategoriesModule,
		ProductsModule,
		SettingsModule,
		DeliveryMethodsModule,
		OutskirtsModule,
		DeliveryZonesModule,
		OrdersModule,
		CustomersModule,
		ContentsModule,
		PromoCodesModule,
		AnnouncementsModule,
		SubscribersModule,
		ContactUsModule,
		ArticlesModule,
		SliceBoxOptionsModule,
		SliceBoxesModule,
		MailGunModule,
		ValidatedEmailsModule,
		BundlesModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule implements NestModule {
	public configure(consumer: MiddlewareConsumer): void {
		consumer
			.apply(RawBodyMiddleware)
			.forRoutes({
				path: '/orders/stripe/webhook',
				method: RequestMethod.POST,
			})
			.apply(UrlEncodedBodyMiddleware)
			.forRoutes({
				path: '/orders/hitpay/webhook',
				method: RequestMethod.POST,
			})
			.apply(JsonBodyMiddleware)
			.forRoutes('*');
	}
}
