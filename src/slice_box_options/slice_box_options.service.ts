import { Injectable } from '@nestjs/common';

import { CreateSliceBoxOptionDto } from './dto/create-slice-box-option.dto';
import { GetSliceBoxOptionsQueryDto } from './dto/get-slice-box-options.query.dto';
import { UpdateSliceBoxOptionDto } from './dto/update-slice-box-option.dto';

import { SliceBoxOptionRepository } from './repositories/slice_box_option.repository';

@Injectable()
export class SliceBoxOptionsService {
	constructor(private sliceBoxOptionRepository: SliceBoxOptionRepository) {}

	getOptions(query: GetSliceBoxOptionsQueryDto) {
		return this.sliceBoxOptionRepository.getList(query);
	}

	getOption(id: string) {
		return this.sliceBoxOptionRepository.findById(id);
	}

	createOption(payload: CreateSliceBoxOptionDto) {
		return this.sliceBoxOptionRepository.create(payload);
	}

	updateOption(id: string, payload: UpdateSliceBoxOptionDto) {
		return this.sliceBoxOptionRepository.update(id, payload);
	}
}
