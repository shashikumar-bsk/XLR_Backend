import { Server as SocketIOServer, Socket } from 'socket.io';
 // Adjust the path as needed
import { Server as HttpServer } from 'http';
import { acceptRide } from '../routes/rideService'; // Adjust the path as needed
import { getAvailableDrivers } from '../services/driverService';
import { createAdapter } from '@socket.io/redis-adapter';
import redisClient from '../redis/redis';

let io: SocketIOServer;

const initializeSocket = (server: HttpServer): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*', // Adjust according to your CORS policy
    },
  });

  const pubClient = redisClient.duplicate();
  const subClient = redisClient.duplicate();
  io.adapter(createAdapter(pubClient, subClient));

  io.on('connection', (socket: Socket) => {
    console.log('New client connected', socket.id);

     // Example: Store and retrieve from Redis
     socket.on('store_message', (message: string) => {
      redisClient.set('last_message', message, (err:any) => {
        if (err) {
          console.error('Error storing message in Redis:', err);
        } else {
          console.log('Message stored in Redis');
        }
      });
    });

    socket.on('get_message', async () => {
      try {
        const message = await redisClient.get('last_message');
        socket.emit('receive_message', message);
      } catch (err) {
        console.error('Error retrieving message from Redis:', err);
      }
    });

    // Handle ride request
    socket.on('ride_request', async (data: any, callback: Function) => {
      try {
        console.log('Ride request received:', data);

        // Fetch available drivers
        const availableDrivers = await getAvailableDrivers();
        console.log('Available drivers:', availableDrivers);

        // Emit ride request event to all connected clients
        io.emit('ride_requested', data);
        console.log('Emitting ride_request to all connected clients');

        // Send acknowledgment back to the client
        if (typeof callback === 'function') {
          callback({ status: 'success', message: 'Ride request processed successfully' });
        } else {
          console.error('Callback function is not provided or invalid');
        }
      } catch (error) {
        console.error('Error handling ride request:', error);
        if (typeof callback === 'function') {
          callback({ status: 'error', message: 'Failed to process ride request' });
        } else {
          console.error('Callback function is not provided or invalid');
        }
      }
    });

    // Handle ride accepted
    socket.on('ride_accepted', async (data: any) => {
      const { request_id, driver_id } = data;
      console.log('Ride accepted event received:', data);

      try {
        // Use the acceptRide service to handle the acceptance
        const { rideRequest, driver } = await acceptRide(request_id, driver_id);

        // Emit ride accepted event to all connected clients
        io.emit('ride_accepted', { rideRequest, driver });
        console.log('Emitting ride_accepted to all connected clients');
      } catch (error) {
        console.error('Error handling ride_accepted event:', error);
      }
    });

    // Handle driver connection
    socket.on('driver_connected', (driverId: string) => {
      console.log(`Received driver_connected event for driver ${driverId}`);
      // You can keep track of driver connections here if needed
    });

    // Handle user connection
    socket.on('user_connected', (userId: string) => {
      console.log(`User ${userId} connected with socket ID ${socket.id}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      // Handle disconnection logic if needed
    });

    // Other socket event handlers can be defined here
  });

  return io;
};

const getSocketInstance = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initializeSocket first.');
  }
  return io;
};

export { initializeSocket, getSocketInstance };

