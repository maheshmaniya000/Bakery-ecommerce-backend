import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { SubscriberSchema } from "./schemas/subscribe.schema";
import { SubscribersController } from "./subscribers.controller";
import { SubscribersService } from "./subscribers.service";

@Module({
    imports: [
        MongooseModule.forFeatureAsync([
            {
                name: 'Subscriber',
                useFactory: () => {
                    const schema = SubscriberSchema;

                    schema.plugin(require('mongoose-paginate-v2')); // eslint-disable-line

                    return schema;
                }
            }
        ])
    ],
    providers: [SubscribersService],
    controllers: [SubscribersController],
    exports: []
})
export class SubscribersModule {}