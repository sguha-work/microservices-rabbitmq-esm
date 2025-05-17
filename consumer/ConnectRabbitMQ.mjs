import amqp from 'amqplib';
class ConnectRabbitMQ {
    RABBITMQ_URL = null;
    QUEUE_NAME = null;
    setRabbitMQUrl(url) {
        this.RABBITMQ_URL = url;
        return this;
    }
    setQueueName(name) {
        this.QUEUE_NAME = name;
        return this;
    }
    async connect() {
        try {
            console.log(`connecting to ${this.RABBITMQ_URL} and ${this.QUEUE_NAME}`);

            const connection = await amqp.connect(this.RABBITMQ_URL);
            let channel = await connection.createChannel();
            await channel.assertQueue(this.QUEUE_NAME);
            return channel;
        } catch (error) {
            console.error('Error connecting to RabbitMQ:', error);
            return null;
        }
    }
}
export default ConnectRabbitMQ;