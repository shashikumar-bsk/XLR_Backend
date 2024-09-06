import { Kafka, logLevel } from 'kafkajs';
import { RideRequest } from '../db/models';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import redisClient from '../redis/redis';
import { createAdapter } from '@socket.io/redis-adapter';

let io: SocketIOServer;

export const initializeSocket = (server: HttpServer): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
    },
  });

  const pubClient = redisClient.duplicate();
  const subClient = redisClient.duplicate();
  io.adapter(createAdapter(pubClient, subClient));

  // Run Kafka only after the io instance is initialized
  runKafka(io).catch(console.error);

  return io;
};

const drivers: { [key: string]: Socket } = {};
const users: { [key: string]: Socket } = {}; // Store user sockets
const pendingRides: { [key: string]: any } = {}; // Cache for pending rides

// Initialize Kafka
const kafka = new Kafka({
  clientId: 'ride-booking-app',
  brokers: ['localhost:9092'],
  logLevel: logLevel.ERROR, // Set log level to ERROR
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'ride-booking-group' });

async function runKafka(io: SocketIOServer) {
  await producer.connect();
  await consumer.connect();
  console.log("Kafka connected");

  await consumer.subscribe({ topic: 'ride-requests', fromBeginning: true });
  await consumer.subscribe({ topic: 'ride-accepted', fromBeginning: true });
  await consumer.subscribe({ topic: 'ride-completed', fromBeginning: true });
  await consumer.subscribe({ topic: 'driver-location', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const data = JSON.parse((message.value ?? '{}').toString());

      switch (topic) {
        case 'ride-requests':
          if (data.status === 'pending') {
            // Store pending ride in cache
            pendingRides[data.bookingId] = data;

            Object.values(drivers).forEach((socket) => {
              // Emit the filled ride request data to the driver
              socket.emit('PENDING_RIDE_REQUEST', data);
            });
          }
          break;
        case 'ride-accepted':
          io.emit('RIDE_ACCEPTED', data);
          if (users[data.userId]) {
            users[data.userId].emit('RIDE_ACCEPTED', {
              request_id: data.bookingId,
              user_id: data.userId,
              driver_id: data.driverId,
              service_type_id: data.serviceType,
              receiver_id: data.receiverId,             
              booking_id: data.bookingId,
              status: data.status,
              rideDetails: pendingRides[data.bookingId],
            });
          }

          // Update the ride in the cache and database
          if (pendingRides[data.bookingId]) {
            pendingRides[data.bookingId].status = 'accepted';
            pendingRides[data.bookingId].driverId = data.driverId;
            await RideRequest.upsert(pendingRides[data.bookingId]);
          }
          break;
        case 'ride-completed':
          io.emit('RIDE_COMPLETED', data);
          // Emit to the user who made the request
          if (users[data.userId]) {
            users[data.userId].emit('RIDE_COMPLETED', data);
          }
          // Update the ride in the cache and database
          if (pendingRides[data.bookingId]) {
            pendingRides[data.bookingId].status = 'completed';
            pendingRides[data.bookingId].driverId = data.driverId;
            await RideRequest.upsert(pendingRides[data.bookingId]);
            delete pendingRides[data.bookingId];
          }
          break;
      }
    },
  });

  // Periodically sync data to the database every 10 seconds
  setInterval(async () => {
    for (const bookingId in pendingRides) {
      const ride = pendingRides[bookingId];
      await RideRequest.upsert(ride);
    }
  }, 10000); // Sync every 10 seconds
}

// Socket event handlers
export const socketHandlers = (io: SocketIOServer) => {
  io.on('connection', (socket: Socket) => {
    console.log('A client connected:', socket.id);

    socket.on('REGISTER_DRIVER', (data) => {
      drivers[data.driverId] = socket;

      // Emit all pending rides to the connected driver
      Object.values(pendingRides).forEach((ride) => {
        if (ride.status === 'pending') {
          socket.emit('PENDING_RIDE_REQUEST', ride);
        }
      });
    });

    socket.on('REQUEST_RIDE', async (data) => {
      const rideRequest = {
        rideBookingId: 'ride_' + Math.random().toString(36).substr(2, 9),
        userId: data.userId,
        driverId: data.driverId,
        startLocation: data.startLocation,
        endLocation: data.endLocation,
        fare: data.fare,
        status: 'pending',
        distance: data.distance,
        duration: data.duration,
        time: new Date().toISOString(),
        bookingFee: data.bookingFee,
        rideCharge: data.rideCharge,
      };

      await producer.send({
        topic: 'ride-requests',
        messages: [
          {
            value: JSON.stringify(rideRequest),
          },
        ],
      });

      // Store in pending rides cache
      pendingRides[rideRequest.rideBookingId] = rideRequest;

      // Store user socket
      users[data.userId] = socket;

      socket.emit('RIDE_REQUEST_SENT', { rideBookingId: rideRequest.rideBookingId });
    });

    socket.on('ACCEPT_RIDE', async (data) => {
      const rideAcceptance = {
        bookingId: data.bookingId,
        driverId: data.driverId,
        userId: data.userId,
        status: 'accepted',
      };

      await producer.send({
        topic: 'ride-accepted',
        messages: [
          {
            value: JSON.stringify(rideAcceptance),
          },
        ],
      });

      // Update the ride in the cache and database
      if (pendingRides[data.bookingId]) {
        pendingRides[data.bookingId].status = 'accepted';
        pendingRides[data.bookingId].driverId = data.driverId;
        await RideRequest.upsert(pendingRides[data.bookingId]);
      }
    });

    socket.on('COMPLETE_RIDE', async (data) => {
      const rideCompletion = {
        bookingId: data.bookingId,
        driverId: data.driverId,
        userId: data.userId,
        status: 'completed',
      };

      await producer.send({
        topic: 'ride-completed',
        messages: [
          {
            value: JSON.stringify(rideCompletion),
          },
        ],
      });

      // Update the ride in the cache and database
      if (pendingRides[data.bookingId]) {
        pendingRides[data.bookingId].status = 'completed';
        await RideRequest.upsert(pendingRides[data.bookingId]);
        delete pendingRides[data.bookingId];
      }
    });

    socket.on('REGISTER_USER', (data) => {
      users[data.userId] = socket;
    });

    socket.on('disconnect', () => {
      for (const driverId in drivers) {
        if (drivers[driverId] === socket) {
          delete drivers[driverId];
          break;
        }
      }
      for (const userId in users) {
        if (users[userId] === socket) {
          delete users[userId];
          break;
        }
      }
      console.log('A client disconnected:', socket.id);
    });
  });
};

export const getSocketInstance = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initializeSocket first.');
  }
  return io;
};
