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

  app.listen(PORT, async () => {
    console.log(`Producer service running on port ${PORT}`);
    const RABBITMQ_URL = `amqp://${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`;
    const connectRabbitMQ = new ConnectRabbitMQ();
    try {
      channel = await connectRabbitMQ.setRabbitMQUrl(RABBITMQ_URL).setQueueName(PRODUCER_QUEUE_NAME).connect();
      console.log("Producer connected to RabbitMQ");
    } catch (error) {
      console.error('Error connecting to RabbitMQ:', error);
      process.exit(1);
    }
  });
})()