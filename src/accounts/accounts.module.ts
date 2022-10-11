import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Account, AccountSchema } from './schemas/account.schema';
import { AccountsService } from './accounts.service';

import { ValidatedEmailsModule } from 'src/validated_emails/validated_emails.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: Account.name, schema: AccountSchema },
		]),

		ValidatedEmailsModule,
	],
	providers: [AccountsService],
	exports: [AccountsService],
})
export class AccountsModule {}
