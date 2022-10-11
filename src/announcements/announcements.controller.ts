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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ParamDto } from 'src/utils/dto/param.dto';

import { AdminGuard } from '../common/guards/AdminGuard';

import { AnnouncementsService } from './announcements.service';

import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { GetAnnouncementsDto } from './dto/get-announcements.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@ApiTags('Announcements')
@Controller('announcements')
export class AnnouncementsController {
	constructor(private announcementsService: AnnouncementsService) {}

	@Get('')
	async getList(@Query() query: GetAnnouncementsDto) {
		return this.announcementsService.getList(query);
	}

	@Post('')
	@ApiBearerAuth()
	@UseGuards(AdminGuard)
	async create(@Body() payload: CreateAnnouncementDto) {
		return this.announcementsService.create(payload);
	}

	@Get(':id')
	getDetail(@Param() { id }: ParamDto) {
		return this.announcementsService.getDetail(id);
	}

	@Put(':id')
	@ApiBearerAuth()
	@UseGuards(AdminGuard)
	async update(
		@Param() { id }: ParamDto,
		@Body() payload: UpdateAnnouncementDto,
	) {
		return this.announcementsService.update(id, payload);
	}

	@ApiBearerAuth()
	@Put(':id/status')
	@UseGuards(AdminGuard)
	updateStatus(@Param() { id }: ParamDto, @Body('status') status: boolean) {
		return this.announcementsService.updateStatus(id, status);
	}
}
