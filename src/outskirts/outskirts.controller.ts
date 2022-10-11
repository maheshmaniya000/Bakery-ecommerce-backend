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

import { CreateOutskirtDto } from './dto/create_outskirt.dto';
import { GetOutskirtsQueryDto } from './dto/get_outskirts_query.dto';
import { ParamDto } from '../utils/dto/param.dto';
import { UpdateOutskirtDto } from './dto/update_outskirt.dto';

import { OutskirtsService } from './outskirts.service';

@ApiTags('Outskirts')
@Controller('outskirts')
export class OutskirtsController {
	constructor(private readonly outskirtsService: OutskirtsService) {}

	@Get('')
	async getList(
		@Query() { page = 1, limit = 10, status }: GetOutskirtsQueryDto,
	) {
		return this.outskirtsService.getList({ status }, { page, limit });
	}

	@Post('')
	@ApiBearerAuth()
	@UseGuards(AuthGuard('jwt'))
	async create(@Body() payload: CreateOutskirtDto) {
		return this.outskirtsService.create(payload);
	}

	@Get(':id')
	async getDetail(@Param() { id }: ParamDto) {
		return this.outskirtsService.getDetail(id);
	}

	@Put(':id')
	@ApiBearerAuth()
	@UseGuards(AuthGuard('jwt'))
	async update(
		@Param() { id }: ParamDto,
		@Body() payload: UpdateOutskirtDto,
	) {
		return this.outskirtsService.update(id, payload);
	}

	@ApiBearerAuth()
	@Put(':id/status')
	@UseGuards(AuthGuard('jwt'))
	async updateStatus(
		@Param() { id }: ParamDto,
		@Body('status') status: boolean,
	) {
		return this.outskirtsService.updateStatus(id, status);
	}
}
