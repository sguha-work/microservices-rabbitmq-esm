import express from 'express';
import amqp from 'amqplib';

const app = express();
const PORT = process.env.PORT || 3001;
const RABBITMQ_URL = `amqp://${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`;
const QUEUE_NAME = 'messages';

const connectRabbitMQ = () => {
  let channel;
  return async () => {
    if (typeof channel == 'undefined') {
      const connection = await amqp.connect(RABBITMQ_URL);
      const channel = await connection.createChannel();
      await channel.assertQueue(QUEUE_NAME);
    }
    return channel
  }
}

const startConsumer = async () => {
  try {
    const channel = await connectRabbitMQ()();
    console.log('Consumer waiting for messages...');
    channel.consume(QUEUE_NAME, async (message) => {
      if (message) {
        try {
          const content = JSON.parse(message.content.toString());
          console.log(`Received message: ${content.text} at ${content.timestamp}`);
          await channel.ack(message);
        } catch (error) {
          console.error('Error processing message:', error);
          await channel.nack(message);
        }
      }
    });
  } catch (error) {
    console.error('RabbitMQ connection error:', error);
    setTimeout(startConsumer, 5000);
  }
};

app.listen(PORT, () => {
  console.log(`Consumer service running on port ${PORT}`);
  startConsumer();
});
