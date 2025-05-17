import express from 'express';
import ConnectRabbitMQ from './ConnectRabbitMQ.mjs';
(() => {
  const app = express();
  const PORT = process.env.PORT || 3001;
  const RABBITMQ_URL = `amqp://${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`;
  const PRODUCER_QUEUE_NAME = 'producer_messages';
  const connectRabbitMQ = new ConnectRabbitMQ();

  const startConsumer = async () => {
    try {
      let channel = await connectRabbitMQ.setRabbitMQUrl(RABBITMQ_URL).setQueueName(PRODUCER_QUEUE_NAME).connect();
      if (!channel) throw new Error('Not connected to RabbitMQ');
      console.log('Consumer waiting for messages...');
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
    } catch (error) {
      console.error('RabbitMQ connection error:', error);
      setTimeout(startConsumer, 5000);
    }
  };

  app.listen(PORT, () => {
    console.log(`Consumer service running on port ${PORT}`);
    startConsumer();
  });
})()