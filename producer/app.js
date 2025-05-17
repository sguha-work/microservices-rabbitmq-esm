import express from 'express';
import ConnectRabbitMQ from './ConnectRabbitMQ.mjs';

(() => {
  const PRODUCER_QUEUE_NAME = 'producer_messages';

  const app = express();
  app.use(express.json());
  const PORT = process.env.PORT || 3000;
  let channel = null;

  app.post('/producer/send', async (req, res) => {
    try {
      if (!channel) throw new Error('Not connected to RabbitMQ');
      const message = {
        text: req.body.text || 'Hello from producer!',
        timestamp: new Date().toISOString()
      };
      await channel.sendToQueue(PRODUCER_QUEUE_NAME, Buffer.from(JSON.stringify(message)));
      res.status(201).send((JSON.stringify({ data: 'Message sent' })));
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).send(error.message);
    }
  });

  app.listen(PORT, () => {
    console.log(`Producer service running on port ${PORT}`);
    const RABBITMQ_URL = `amqp://${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`;
    const connectRabbitMQ = new ConnectRabbitMQ();
    const interval = setInterval(async () => {
      channel = await connectRabbitMQ.setRabbitMQUrl(RABBITMQ_URL).setQueueName(PRODUCER_QUEUE_NAME).connect();
      if (channel) {
        console.log(`Connected to RabbitMQ at ${RABBITMQ_URL} and queue ${PRODUCER_QUEUE_NAME}`);
        clearInterval(interval);
      }
    }, 1000)
  });
})()