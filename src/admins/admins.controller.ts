import {
	Body,
	Controller,
	Get,
	Post,
	UseGuards,
	Query,
	Put,
	Param,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminGuard } from 'src/common/guards/AdminGuard';
import { ParamDto } from 'src/utils/dto/param.dto';

import { AdminsService } from './admins.service';

import { CreateAdminPayloadDto } from './dto/create/create-admin-payload.dto';
import { GetAdminsQueryDto } from './dto/get-admins-query.dto';
import { UpdateAdminPayloadDto } from './dto/update-admin-payload.dto';

@ApiTags('Admins')
@Controller('admins')
export class AdminsController {
	constructor(private readonly adminsService: AdminsService) {}

	@Get()
	@UseGuards(AdminGuard)
	async getList(@Query() query: GetAdminsQueryDto) {
		return this.adminsService.getList(query);
	}

	@Post('register')
	@UseGuards(AdminGuard)
	async register(@Body() payload: CreateAdminPayloadDto) {
		return this.adminsService.create(payload);
	}

	@Get(':id')
	async getDetail(@Param() { id }: ParamDto) {
		return this.adminsService.getDetail(id);
	}

	@Put(':id')
	@UseGuards(AdminGuard)
	async update(
		@Param() { id }: ParamDto,
		@Body() payload: UpdateAdminPayloadDto,
	) {
		return this.adminsService.update(id, payload);
	}

	@Put(':id/status')
	@UseGuards(AdminGuard)
	updateStatus(@Param() { id }: ParamDto, @Body('status') status: boolean) {
		return this.adminsService.updateStatus(id, status);
	}
}
