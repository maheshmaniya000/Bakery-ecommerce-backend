import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Admin, AdminSchema } from './schemas/admin.schema';
import { AdminsController } from './admins.controller';
import { AdminsService } from './admins.service';

import { AuthModule } from '../auth/auth.module';

@Module({
	imports: [
		forwardRef(() => AuthModule),

		MongooseModule.forFeatureAsync([
			{
				name: Admin.name,
				useFactory: () => {
					const schema = AdminSchema;

					schema.plugin(require('mongoose-paginate-v2')); // eslint-disable-line

					return schema;
				},
			},
		]),
	],
	controllers: [AdminsController],
	providers: [AdminsService],
	exports: [AdminsService],
})
export class AdminsModule {}
