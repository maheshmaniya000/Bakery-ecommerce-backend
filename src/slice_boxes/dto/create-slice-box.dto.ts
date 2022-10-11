import { SliceBoxOption } from 'src/slice_box_options/schemas/slice_box_option.schema';
import { SliceBoxProduct } from '../schemas/slice_box_product.schema';

export class CreateSliceBoxDto {
	option: SliceBoxOption;
	qty: number;
	total: number;
	products: SliceBoxProduct[];
}
