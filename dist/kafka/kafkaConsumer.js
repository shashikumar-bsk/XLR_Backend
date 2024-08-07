"use strict";
// // kafkaConsumer.ts
// import kafka from './kafka';
// const consumer = kafka.consumer({ groupId: 'driver-location-group' });
// const connectConsumer = async () => {
//   await consumer.connect();
// };
// const subscribeAndRun = async (topic: string, callback: (message: any) => void) => {
//   await consumer.subscribe({ topic });
//   await consumer.run({
//     eachMessage: async ({ topic, partition, message }) => {
//       if (message.value) {
//         const data = JSON.parse(message.value.toString());
//         callback(data);
//       }
//     },
//   });
// };
// const disconnectConsumer = async () => {
//   await consumer.disconnect();
// };
// export { connectConsumer, subscribeAndRun, disconnectConsumer };
