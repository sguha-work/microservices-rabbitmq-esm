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
    async connect(maxRetry = 20) {
        return new Promise((resolve, reject)=>{
let index = 1;
        const interval = setInterval(async () => {
            try {
                console.log(`Connecting to ${this.RABBITMQ_URL} and ${this.QUEUE_NAME}`);
                console.log(`Attempt ${index}`);
                index++;
                const connection = await amqp.connect(this.RABBITMQ_URL);
                const channel = await connection.createChannel();
                await channel.assertQueue(this.QUEUE_NAME);
                console.log(`Connected`);
                clearInterval(interval);
                resolve(channel);
            } catch (error) {
                if (index > maxRetry) {
                    console.error('Max retry attempts reached. Exiting...');
                    clearInterval(interval);
                    reject(error);
                } else {
                    console.log('Previous attempt failed, retrying connection to RabbitMQ...');
                }
            }
        }, 5000);
        })
    }
}
export default ConnectRabbitMQ;