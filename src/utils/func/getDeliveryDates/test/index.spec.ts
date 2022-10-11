import { getDeliveryDates } from '..';

describe('getDeliveryDates', () => {
	it('data set 1', () => {
		const data = [
			{ date: 'Fri', isClosed: true },
			{ date: 'Sat', isClosed: false },
			{ date: 'Sun', isClosed: false },
			{ date: 'Mon', isClosed: true },
		];

		const result = getDeliveryDates(data, 2);

		const earliest = result.findIndex((date) => !date.isClosed);

		expect(earliest).toBe(2);
		expect(data[1].isClosed).toBe(true);
	});

	it('data set 2', () => {
		const data = [
			{ date: 'Fri', isClosed: true },
			{ date: 'Sat', isClosed: true },
			{ date: 'Sun', isClosed: false },
			{ date: 'Mon', isClosed: true },
			{ date: 'Tue', isClosed: false },
		];

		const result = getDeliveryDates(data, 2);

		const earliest = result.findIndex((date) => !date.isClosed);

		expect(earliest).toBe(4);
		expect(data[2].isClosed).toBe(true);
	});

	it('data set 3', () => {
		const data = [
			{ date: 'Fri', isClosed: false },
			{ date: 'Sat', isClosed: true },
			{ date: 'Sun', isClosed: false },
			{ date: 'Mon', isClosed: true },
			{ date: 'Tue', isClosed: false },
		];

		const result = getDeliveryDates(data, 2);

		const earliest = result.findIndex((date) => !date.isClosed);

		expect(earliest).toBe(2);
		expect(data[0].isClosed).toBe(true);
	});
});
