import { Module } from '@nestjs/common';

import { ReportsService } from './reports.service';

@Module({
	imports: [],
	providers: [ReportsService],
	exports: [ReportsService],
})
export class ReportsModule {}
