import express from 'express';
import ConnectRabbitMQ from './ConnectRabbitMQ.mjs';
(() => {
  const app = express();
  const PORT = process.env.PORT || 3001;
  const RABBITMQ_URL = `amqp://${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`;
  const PRODUCER_QUEUE_NAME = 'producer_messages';
  const connectRabbitMQ = new ConnectRabbitMQ();

  const startConsumer = async () => {
    let channel = null;
    try {
      channel = await connectRabbitMQ.setRabbitMQUrl(RABBITMQ_URL).setQueueName(PRODUCER_QUEUE_NAME).connect();
      console.log('Consumer waiting for messages...');
    } catch (error) {
      console.error('Error connecting to RabbitMQ:', error);
      process.exit(1);
    }
    channel.consume(PRODUCER_QUEUE_NAME, async (message) => {
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
  };

  app.listen(PORT, () => {
    console.log(`Consumer service running on port ${PORT}`);
    startConsumer();
  });
})()