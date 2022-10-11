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

import { CreateDeliveryZoneDto } from './dto/create_delivery_zone.dto';
import { UpdateDeliveryZoneDto } from './dto/update_delivery_zone.dto';
import { GetDeliveryZonesQueryDto } from './dto/get_delivery_zones_query.dto';
import { ParamDto } from '../utils/dto/param.dto';

import { DeliveryZonesService } from './delivery_zones.service';

@ApiTags('Delivery zones')
@Controller('delivery_zones')
export class DeliveryZonesController {
	constructor(private readonly deliveryZonesService: DeliveryZonesService) {}

	@Get('')
	async getList(
		@Query() { page = 1, limit = 10, ...query }: GetDeliveryZonesQueryDto,
	) {
		return this.deliveryZonesService.getList(query, { page, limit });
	}

	@Post('')
	@ApiBearerAuth()
	@UseGuards(AuthGuard('jwt'))
	async create(@Body() payload: CreateDeliveryZoneDto) {
		return this.deliveryZonesService.create(payload);
	}

	@Get(':id')
	async getDetail(@Param() { id }: ParamDto) {
		return this.deliveryZonesService.getDetail(id);
	}

	@Put(':id')
	@ApiBearerAuth()
	@UseGuards(AuthGuard('jwt'))
	async update(
		@Param() { id }: ParamDto,
		@Body() payload: UpdateDeliveryZoneDto,
	) {
		return this.deliveryZonesService.update(id, payload);
	}

	@ApiBearerAuth()
	@Put(':id/status')
	@UseGuards(AuthGuard('jwt'))
	async updateStatus(
		@Param() { id }: ParamDto,
		@Body('status') status: boolean,
	) {
		return this.deliveryZonesService.updateStatus(id, status);
	}
}
