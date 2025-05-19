import express from 'express';
import ConnectRabbitMQ from './ConnectRabbitMQ.mjs';
(() => {
  const app = express();
  app.use(express.json());
  const PORT = process.env.PORT || 3001;
  const RABBITMQ_URL = `amqp://${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`;
  const PRODUCER_QUEUE_NAME = 'producer_messages'; // will be used to consume message from producer
  const CONSUMER_QUEUE_NAME = 'consumer_messages';// will be used to send message from consumer to producer
  let consumerChannel1 = null;
  let consumerChannel2 = null;


  const initiateConsumingMessages = async () => {
    consumerChannel1.consume(CONSUMER_QUEUE_NAME, async (message) => {
      if (message) {
        try {
          const content = JSON.parse(message.content.toString());
          console.log(`Received message from producer: ${content.text} at ${content.timestamp}`);
          await consumerChannel1.ack(message);
        } catch (error) {
          console.error('Error processing message:', error);
          await consumerChannel1.nack(message);
        }
      }
    });
  };

  app.post('/consumer/send', async (req, res) => {
    try {
      if (!consumerChannel2) throw new Error('Not connected to RabbitMQ');
      const message = {
        text: req.body.text || 'Hello from consumer!',
        timestamp: new Date().toISOString()
      };
      await consumerChannel2.sendToQueue(CONSUMER_QUEUE_NAME, Buffer.from(JSON.stringify(message)));
      res.status(201).send((JSON.stringify({ data: 'Message sent' })));
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).send(error.message);
    }
  });

  app.listen(PORT, async () => {
    console.log(`Consumer service running on port ${PORT}`);
    const RABBITMQ_URL = `amqp://${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`;
    const connectRabbitMQ = new ConnectRabbitMQ();
    try {
      consumerChannel1 = await connectRabbitMQ.setRabbitMQUrl(RABBITMQ_URL).setQueueName(PRODUCER_QUEUE_NAME).connect();
      consumerChannel2 = await connectRabbitMQ.setRabbitMQUrl(RABBITMQ_URL).setQueueName(CONSUMER_QUEUE_NAME).connect();
      console.log("Consumer connected to RabbitMQ");
      initiateConsumingMessages();
    } catch (error) {
      console.error('Error connecting to RabbitMQ:', error);
      process.exit(1);
    }
  });
})()