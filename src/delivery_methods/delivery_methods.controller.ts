import {
	Body,
	Controller,
	Get,
	Param,
	Post,
	Put,
	Query,
	UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { DeliveryMethodsService } from './delivery_methods.service';

import { CreateDeliveryMethodDto } from './dto/create_delivery_method.dto';
import { UpdateDeliveryMethodDto } from './dto/update_delivery_method.dto';
import { GetDeliveryMethodsQueryDto } from './dto/get_delivery_methods_query.dto';
import { ParamDto } from '../utils/dto/param.dto';

@ApiTags('Delivery methods')
@Controller('delivery_methods')
export class DeliveryMethodsController {
	constructor(
		private readonly deliveryMethodsService: DeliveryMethodsService,
	) {}

	@Get('')
	async getList(
		@Query() { page = 1, limit = 10, status }: GetDeliveryMethodsQueryDto,
	) {
		return this.deliveryMethodsService.getList({ status }, { page, limit });
	}

	@Post('')
	@ApiBearerAuth()
	@UseGuards(AuthGuard('jwt'))
	async create(@Body() payload: CreateDeliveryMethodDto) {
		return this.deliveryMethodsService.create(payload);
	}

	@Get(':id')
	async getDetail(@Param() { id }: ParamDto) {
		return this.deliveryMethodsService.getDetail(id);
	}

	@Put(':id')
	@ApiBearerAuth()
	@UseGuards(AuthGuard('jwt'))
	async update(
		@Param() { id }: ParamDto,
		@Body() payload: UpdateDeliveryMethodDto,
	) {
		return this.deliveryMethodsService.update(id, payload);
	}

	@ApiBearerAuth()
	@Put(':id/status')
	@UseGuards(AuthGuard('jwt'))
	async updateStatus(
		@Param() { id }: ParamDto,
		@Body('status') status: boolean,
	) {
		return this.deliveryMethodsService.updateStatus(id, status);
	}
}
