import {
	Body,
	Controller,
	Get,
	HttpCode,
	Param,
	Post,
	Put,
	Query,
	UseGuards,
} from '@nestjs/common';

import { AdminGuard } from 'src/common/guards/AdminGuard';
import { ParamDto } from 'src/utils/dto/param.dto';

import { BundlesService } from './bundles.service';

import { CreateBundleBodyDto } from './dto/create-bundle-body.dto';
import { GetAvailableBundlesQueryDto } from './dto/get-available-bundles-query.dto';
import { GetBundlesQueryDto } from './dto/get-bundles-query.dto';
import { GetDeliverableDatesQueryDto } from './dto/get-deliverable-dates-query.dto';
import { UpdateBundleBodyDto } from './dto/update-bundle-body.dto';

@Controller('bundles')
export class BundlesController {
	constructor(private bundlesService: BundlesService) {}

	@Get('')
	@UseGuards(AdminGuard)
	getList(@Query() params: GetBundlesQueryDto) {
		return this.bundlesService.getBundles(params);
	}

	@Get('availables')
	getAvailables(@Query() query: GetAvailableBundlesQueryDto) {
		return this.bundlesService.getAvailableBundles(query);
	}

	@Post('')
	@UseGuards(AdminGuard)
	create(@Body() payload: CreateBundleBodyDto) {
		return this.bundlesService.createBundle(payload);
	}

	@Get('slug/:slug')
	getBySlug(@Param('slug') slug: string) {
		return this.bundlesService.getBundleBySlug(slug);
	}

	@Put(':id')
	@UseGuards(AdminGuard)
	update(@Param() { id }: ParamDto, @Body() payload: UpdateBundleBodyDto) {
		return this.bundlesService.updateBundle(id, payload);
	}

	@Get(':id/detail')
	getDetail(@Param() { id }: ParamDto) {
		return this.bundlesService.getBundleDetail(id);
	}

	@Get(':id/deliverable-dates')
	getDeliverableDates(
		@Param() { id }: ParamDto,
		@Query() { qty }: GetDeliverableDatesQueryDto,
	) {
		return this.bundlesService.getDeliverableDates(id, qty);
	}

	@HttpCode(200)
	@Put(':id/status')
	@UseGuards(AdminGuard)
	updateStatus(@Param() { id }: ParamDto, @Body('status') status: boolean) {
		return this.bundlesService.updateBundleStatus(id, status);
	}
}
