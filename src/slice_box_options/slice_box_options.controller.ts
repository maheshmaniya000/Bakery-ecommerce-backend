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

import { AdminGuard } from 'src/common/guards/AdminGuard';
import { ParamDto } from 'src/utils/dto/param.dto';

import { CreateSliceBoxOptionDto } from './dto/create-slice-box-option.dto';
import { GetSliceBoxOptionsQueryDto } from './dto/get-slice-box-options.query.dto';
import { UpdateSliceBoxOptionDto } from './dto/update-slice-box-option.dto';

import { SliceBoxOptionsService } from './slice_box_options.service';

@Controller('slice_box_options')
export class SliceBoxOptionsController {
	constructor(private sliceBoxOptionsService: SliceBoxOptionsService) {}

	@Get('')
	getList(@Query() query: GetSliceBoxOptionsQueryDto) {
		return this.sliceBoxOptionsService.getOptions(query);
	}

	@Post('')
	@UseGuards(AdminGuard)
	create(@Body() payload: CreateSliceBoxOptionDto) {
		return this.sliceBoxOptionsService.createOption(payload);
	}

	@Get(':id')
	getDetail(@Param() { id }: ParamDto) {
		return this.sliceBoxOptionsService.getOption(id);
	}

	@Put(':id')
	@UseGuards(AdminGuard)
	update(
		@Param() { id }: ParamDto,
		@Body() payload: UpdateSliceBoxOptionDto,
	) {
		return this.sliceBoxOptionsService.updateOption(id, payload);
	}
}
