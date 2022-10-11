import * as alphanumic from 'alphanum-increment';
import * as moment from 'moment-timezone';
import { includes } from 'lodash';

export const generateUniqueNo = (uniqueNo: string, prefix = ''): string => {
	const current = moment().format('YYMM');

	if (!uniqueNo) {
		return `${prefix}${current}000a`;
	} else if (uniqueNo.substr(prefix.length, 4) !== current) {
		return `${current}000a`;
	} else {
		return alphanumic.increment(uniqueNo, {
			digit: false,
			dashes: false,
		});
	}
};

export const generateOrderNo = (uniqueNo: string): string => {
	if (!uniqueNo) {
		return `210000`;
	} else {
		return alphanumic.increment(uniqueNo, {
			alpha: false,
			dashes: false,
		});
	}
};

export function generateCode(length = 20): string {
	let result = '';
	const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
	const charactersLength = characters.length;

	for (let i = 0; i < length; i++) {
		result += characters.charAt(
			Math.floor(Math.random() * charactersLength),
		);
	}

	return result;
}

export const dateBetweenQuery = (startDate: string, endDate?: string) => {
	moment.tz.setDefault('Asia/Singapore');

	if (startDate && !endDate) {
		return {
			$gte: moment(startDate, 'YYYY-MM-DD').toDate(),
			$lt: moment(startDate, 'YYYY-MM-DD').add(1, 'd').toDate(),
		};
	}

	if (startDate && endDate) {
		return {
			$gte: moment(startDate, 'YYYY-MM-DD').toDate(),
			$lte: moment(endDate, 'YYYY-MM-DD').toDate(),
		};
	}
};

export const ImageOptions = {
	fileFilter: (req, file, cb) => {
		// allowed types
		const types = ['image/jpeg', 'image/png', 'image/svg'];

		if (includes(types, file.mimetype)) {
			cb(null, true);
		} else {
			cb(null, false);
		}
	},
	limits: {
		fileSize: 8000000,
	},
};
