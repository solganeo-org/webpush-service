import amqp from 'amqplib';
import {RabbitConfig, vars} from '../config';

export class RabbitClient {

    conn: any;
    consumers: any;
    rabbitConfig: RabbitConfig;

    static instance: any = null;

    private constructor(rabbitConfig: RabbitConfig) {

        this.rabbitConfig = rabbitConfig;
        this.consumers = {};

    }

    static getInstance = () => {
        return RabbitClient.instance || (RabbitClient.instance = new RabbitClient(vars.get('rabbit')))
    }

    async connect(): Promise<void> {

        console.log(this.rabbitConfig.url);
        
        try{
            this.conn = await amqp.connect(this.rabbitConfig.url);
        }

        catch(error){
            console.log(error);
        }
    }

    async initializeConsumer(consumerName: string, queue: string ): Promise<void> {

        try{

            this.consumers[consumerName] = await this.conn.createChannel();
            await this.consumers[consumerName].assertQueue(queue, {durable: false});
            await this.consumers[consumerName].prefetch(1);
            console.log(`Producer ${consumerName} initialized`);

        }

        catch(error){
            console.log(error);
        }

    }

    consume(consumerName: string, queue: string): void {

        const channel: any = this.consumers[consumerName];

        channel.consume(queue, (message: any) => {

            console.log(message.content.toString());

            channel.ack(message)

          })

    }

    async close(): Promise<void> {
        await Promise.all(Object.values(this.consumers).map((consumer: any) => consumer.close()))
        return this.conn.close()
      }

}