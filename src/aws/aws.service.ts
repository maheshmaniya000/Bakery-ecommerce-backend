import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';
import { generate as ShortUUID } from 'short-uuid';

@Injectable()
export class AWSService {
	private s3 = null;
	private bucket = '';

	constructor(private readonly configService: ConfigService) {
		this.s3 = new S3(this.configService.get('aws'));
		this.bucket = this.configService.get('aws.bucket') + '/images';
	}

	async uploadToS3(files: Express.Multer.File[]): Promise<string[]> {
		const paths: string[] = [];

		try {
			for (let index = 0; index < files.length; index++) {
				const { Location } = await this.s3
					.upload({
						Bucket: this.bucket,
						Key: ShortUUID() + files[index].originalname,
						Body: files[index].buffer,
						ContectType: files[index].mimetype,
					})
					.promise();

				paths.push(Location);
			}
		} catch (err) {
			throw new Error(err);
		}

		return paths;
	}

	async removeFromS3(path: string): Promise<void> {
		try {
			if (path.split('/')[4])
				await this.s3
					.deleteObject({
						Bucket: this.bucket,
						Key: path.split('/')[4],
					})
					.promise();
		} catch (err) {
			throw new Error(err);
		}
	}
}
