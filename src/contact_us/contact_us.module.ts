import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ContactUs, ContactUsSchema } from './schemas/contact_us.schema';
import { ContactUsService } from './contact_us.service';
import { ContactUsController } from './contact_us.controller';

@Module({
	imports: [
		MongooseModule.forFeatureAsync([
			{
				name: ContactUs.name,
				useFactory: () => {
					const schema = ContactUsSchema;

					schema.plugin(require('mongoose-paginate-v2')); // eslint-disable-line

					return schema;
				},
			},
		]),
	],
	controllers: [ContactUsController],
	providers: [ContactUsService],
	exports: [],
})
export class ContactUsModule {}
