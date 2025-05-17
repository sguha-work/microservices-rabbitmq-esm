import amqp from 'amqplib';
class ConnectRabbitMQ {
    static instance = null;
    channel = null;
    constructor() {
        if (connectRabbitMQ.instance instanceof connectRabbitMQ) {
            return connectRabbitMQ.instance;
        }
        connectRabbitMQ.instance = this;
    }
    async connect() {
        const connection = await amqp.connect(RABBITMQ_URL);
        this.channel = await connection.createChannel();
        await this.channel.assertQueue(QUEUE_NAME);
        return this.channel;
    }
}
export default ConnectRabbitMQ;