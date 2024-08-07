// // kafkaProducer.ts
// import kafka from './kafka';

// const producer = kafka.producer();

// const connectProducer = async () => {
//   await producer.connect();
// };

// const disconnectProducer = async () => {
//   await producer.disconnect();
// };

// const sendMessage = async (topic: string, message: any) => {
//   try {
//     await producer.send({
//       topic,
//       messages: [{ value: JSON.stringify(message) }],
//     });
//     console.log(`Message sent to Kafka topic '${topic}':`, message);
//   } catch (error) {
//     console.error('Error sending message to Kafka:', error);
//   }
// };

// export { connectProducer, disconnectProducer, sendMessage };
