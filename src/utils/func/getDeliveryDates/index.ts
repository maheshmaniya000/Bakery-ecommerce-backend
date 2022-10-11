import { IDate } from './types';

export const getDeliveryDates = (dates: IDate[], preparationDays: number) => {
	let index = 0;
	let workingDays = 0;

	while (workingDays < preparationDays - 1) {
		if (!dates[index].isClosed) {
			workingDays++;
			dates[index].isClosed = true;
		}

		index++;
	}

	return dates;
};
