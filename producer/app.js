import express from 'express';
import ConnectRabbitMQ from './ConnectRabbitMQ.mjs';

(() => {
  const PRODUCER_QUEUE_NAME = 'producer_messages';
  const CONSUMER_QUEUE_NAME = 'consumer_messages';
  const app = express();
  app.use(express.json());
  const PORT = process.env.PORT || 3000;
  let producerChannel1 = null; // will be used for sending message to consumer
  let producerChannel2 = null; // will be used for receiving message from consumer

  const initiateConsumingMessages = async () => {
    if (!producerChannel2) throw new Error('Consuming message queue is not connected to RabbitMQ');
    try {
      producerChannel2.consume(PRODUCER_QUEUE_NAME, async (message) => {
        if (message) {
          try {
            const content = JSON.parse(message.content.toString());
            console.log(`Received message from consumer: ${content.text} at ${content.timestamp}`);
            await producerChannel2.ack(message);
          } catch (error) {
            console.error('Error processing message:', error);
            await producerChannel2.nack(message);
          }
        }
      });
    } catch (error) {
      console.error('Error consuming messages:', error);
    }
  };

  app.post('/producer/send', async (req, res) => {
    try {
      if (!producerChannel1) throw new Error('Not connected to RabbitMQ');
      const message = {
        text: req.body.text || 'Hello from producer!',
        timestamp: new Date().toISOString()
      };
      await producerChannel1.sendToQueue(PRODUCER_QUEUE_NAME, Buffer.from(JSON.stringify(message)));
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
      producerChannel1 = await connectRabbitMQ.setRabbitMQUrl(RABBITMQ_URL).setQueueName(PRODUCER_QUEUE_NAME).connect();
      producerChannel2 = await connectRabbitMQ.setRabbitMQUrl(RABBITMQ_URL).setQueueName(CONSUMER_QUEUE_NAME).connect();
      console.log("Producer connected to RabbitMQ");
      initiateConsumingMessages();
    } catch (error) {
      console.error('Error connecting to RabbitMQ:', error);
      process.exit(1);
    }
  });
})()