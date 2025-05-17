import express from 'express';
import amqp from 'amqplib';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const RABBITMQ_URL = `amqp://${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`;
const PRODUCER_QUEUE_NAME = 'producer_messages';

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

app.post('/producer/send', async (req, res) => {
  try {
    let channel = await connectRabbitMQ()();
    if (!channel) throw new Error('Not connected to RabbitMQ');
    
    const message = {
      text: req.body.text || 'Hello from producer!',
      timestamp: new Date().toISOString()
    };

    await channel.sendToQueue(PRODUCER_QUEUE_NAME, Buffer.from(JSON.stringify(message)));
    console.log(`Sent message: ${message.text}`);
    res.send('Message sent');
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).send(error.message);
  }
});

app.listen(PORT, () => {
  console.log(`Producer service running on port ${PORT}`);
  connectRabbitMQ();
});