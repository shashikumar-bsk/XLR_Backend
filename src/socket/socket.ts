import { Socket as SocketIOSocket, Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import redis from '../redis/redis';
import vehicleBooking from '../db/models/vehicleBooking';

// Driver interface
interface Driver {
  driverId: number;
  vehicleType: string;
  latitude: number;
  longitude: number;
  drivername:string,
  phone:string,
  socketId: string; // Driver's socketId
}

// BookingData interface
interface BookingData {
  bookingId: string;
  userId: number;
  driverId: number;
  pickupAddress: {
    name:string;
    latitude: number;
    longitude: number;
  };
  dropoffAddress: {
    name: string;
    latitude: number;
    longitude: number;
  };
  totalPrice: number;
  vehicleName: string;
  sender_name:string,
  sender_phone:string,
  receiver_name:string,
  receiver_phone:string,

}

// Store active drivers
const activeDrivers: Record<number, Driver> = {};

// Store active user bookings (optional if you want to map user booking to user socketId)
const activeUserBookings: Record<string, string> = {}; // Maps bookingId to user socketId

// Haversine formula to calculate distance between two coordinates
const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const toRad = (value: number): number => (value * Math.PI) / 180;

  const R = 6371; // Radius of the Earth in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in kilometers
};

// Function to initialize the socket server (for both users and drivers)
export const initializeSocket = (server: HttpServer) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ["GET", "POST"],
    },
  });
  return io;
};

// Function to handle socket events for users and drivers
export const socketHandlers = (io: SocketIOServer) => {
  io.on('connection', (socket: SocketIOSocket) => {
    console.log('Client connected:', socket.id);

    /* -------------------- USER SOCKET HANDLERS -------------------- */
    socket.on('REQUEST_BOOKING', async (bookingData: BookingData) => {
      const {
        bookingId,
        userId,
        driverId,
        pickupAddress,
        dropoffAddress,
        totalPrice,
        vehicleName,
        sender_name,
        sender_phone,
        receiver_name,
        receiver_phone,
      } = bookingData;
    
      console.log(`Booking request received from user ${userId} for driver ${driverId}`);
    
      const driver = activeDrivers[driverId];
      if (driver) {
        try {
          await redis.set(`booking:${bookingId}`, JSON.stringify(bookingData), 'EX', 3600); // Store booking in Redis
          console.log(`Stored booking data in Redis for bookingId: ${bookingId}`);
        } catch (err: any) {
          console.error(`Failed to store booking in Redis: ${err.message}`);
          socket.emit('bookingError', 'Internal server error while processing booking.');
          return;
        }
    
        // Emit ride request to the initially assigned driver
        io.to(driver.socketId).emit('BOOKING_REQUEST', {
          bookingId,
          userId,
          driverId, // Include the driverId
          pickupAddress,
          dropoffAddress,
          totalPrice,
          vehicleName,
          sender_name,
          sender_phone,
          receiver_name,
          receiver_phone,
        });
    
        console.log(`Ride request emitted to driver ${driver.driverId}`);
    
        // Store the user socketId and bookingId mapping
        activeUserBookings[bookingId] = socket.id;
    
      } else {
        console.log(`Driver ${driverId} not found or not connected.`);
        const availableDrivers = Object.values(activeDrivers).filter(
          (d) => d.vehicleType === bookingData.vehicleName
        );
    
        if (availableDrivers.length > 0) {
          const newDriver = availableDrivers[0]; // Optionally implement more complex selection logic here
          console.log(`Assigning booking to another driver ${newDriver.driverId}`);
    
          // Emit ride request to the newly assigned driver, including the new driver's ID
          io.to(newDriver.socketId).emit('BOOKING_REQUEST', {
            bookingId,
            userId,
            driverId: newDriver.driverId, // Use the new driver's ID
            pickupAddress,
            dropoffAddress,
            totalPrice,
            vehicleName,
            sender_name,
            sender_phone,
            receiver_name,
            receiver_phone,
          });
        } else {
          socket.emit('bookingError', 'No drivers available with the matching vehicle type.');
        }
      }
    });
    

    /* -------------------- DRIVER SOCKET HANDLERS -------------------- */
    socket.on('DRIVER_RESPONSE', async (response: { 
      driverId: string; 
      bookingId: string; 
      status: string; 
    }) => {
      const { driverId, bookingId, status } = response;
    
      const userSocketId = activeUserBookings[bookingId]; // Get the user's socket ID
    
      if (userSocketId) {
        if (status === 'accepted') {
          console.log("Status sent to ", userSocketId);
    
          try {
            // Fetch driver details from Redis
            const driverData = await redis.get(`driver:${driverId}`);
            if (!driverData) {
              console.error(`Driver data for driverId: ${driverId} not found in Redis`);
              return;
            }
    
            const { drivername, phone } = JSON.parse(driverData);
    
            // Emit ride status with driver details to the user
            io.to(userSocketId).emit('rideRequestStatus', { 
              bookingId, 
              driverId,
              status: 'accepted',
              drivername,  // Driver's name fetched from Redis
              phone        // Driver's phone number fetched from Redis
            });
            console.log("Emitted to user", { 
              bookingId, 
              driverId,
              status: 'accepted',
              drivername,  
              phone        
            });
    
            // Fetch the booking data and update status in Redis
            const bookingData = await redis.get(`booking:${bookingId}`);
            if (bookingData) {
              const updatedBooking = { 
                ...JSON.parse(bookingData), 
                status: 'accepted',
                drivername,  
                phone        
              };
    
              // Save the updated booking data back to Redis
              await redis.set(`booking:${bookingId}`, JSON.stringify(updatedBooking), 'EX', 3600);
              console.log(`Updated Redis booking for bookingId: ${bookingId}`);
            }
    
            // Update the booking status in the database to "In progress"
            const bookingRecord = await vehicleBooking.findOne({ where: { id: bookingId } });
            if (bookingRecord) {
              bookingRecord.status = 'In progress'; // Update status to "In progress"
              await bookingRecord.save(); // Save the changes
              console.log(`Updated booking status to 'In progress' for bookingId: ${bookingId}`);
            } else {
              console.error(`No booking found with bookingId: ${bookingId}`);
            }
          } catch (err: any) {
            console.error(`Failed to fetch driver or update booking in Redis: ${err.message}`);
          }
    
          console.log(`Driver ${driverId} accepted ride ${bookingId}`);
        } else {
          io.to(userSocketId).emit('rideRequestStatus', { 
            bookingId, 
            status: 'rejected' 
          });
          console.log(`Driver ${driverId} rejected ride ${bookingId}`);
        }
      } else {
        console.log(`User for booking ${bookingId} not found`);
      }
    });
    

    /* -------------------- DRIVER SOCKET HANDLERS -------------------- */
    // Driver registers on connection
socket.on('REGISTER_DRIVER', async (driverData: Omit<Driver, 'socketId'>) => {
  const { driverId, vehicleType, latitude, longitude, drivername, phone } = driverData;

  // Log driver data for debugging
  console.log("Registered driver", driverId, vehicleType, latitude, longitude, drivername, phone);

  // Create the driver object to store
  const driverDetails = {
    driverId,
    vehicleType,
    latitude,
    longitude,
    drivername,
    phone,
    socketId: socket.id, // Store driver's socket ID
  };

  // Store driver in activeDrivers list (local memory)
  activeDrivers[driverId] = driverDetails;

  // Convert the driver object to a JSON string for Redis
  const driverKey = `driver:${driverId}`;
  try {
    await redis.set(driverKey, JSON.stringify(driverDetails));
    console.log(`Driver data stored in Redis successfully: ${driverId}`);
  } catch (error) {
    console.error(`Error storing driver data in Redis: ${error}`);
  }
  console.log(`Driver registered successfully: ${driverId}`);
});


 
    /* -------------------- DRIVER LOCATION UPDATES -------------------- */
    socket.on("driverLocation", (data: { vehicleType: string; driverId: number; latitude: number; longitude: number; drivername:string; phone:string }) => {
      const existingDriver = activeDrivers[data.driverId];

      // Update driver's location if they already exist
      if (existingDriver) {
        existingDriver.latitude = data.latitude;
        existingDriver.longitude = data.longitude;
      } else {
        // Add new driver if they don't exist
        activeDrivers[data.driverId] = {
          driverId: data.driverId,
          vehicleType: data.vehicleType,
          latitude: data.latitude,
          longitude: data.longitude,
          drivername: data.drivername,
          phone: data.phone,
          socketId: socket.id,
        };
      }

      // Broadcast updated driver locations to all clients (optional)
      io.emit("driverLocationsUpdated", activeDrivers);
    });

    /* -------------------- USER REQUESTS NEARBY DRIVERS -------------------- */
    socket.on("requestNearbyDrivers", (data: { latitude: number; longitude: number; radius: number }) => {
      const userLatitude = data.latitude;
      const userLongitude = data.longitude;

      // Filter drivers based on the user's location and the specified radius
      const nearbyDrivers = Object.values(activeDrivers).filter((driver) => {
        const distance = haversineDistance(userLatitude, userLongitude, driver.latitude, driver.longitude);
        return distance <= (data.radius || 5); // Default radius to 5 km if not specified
      });

      // Send the nearby drivers back to the user who requested it
      socket.emit("nearbyDrivers", nearbyDrivers);
      console.log("Nearby drivers", nearbyDrivers);
    });

    /* -------------------- DISCONNECTION HANDLER -------------------- */
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);

      // Remove driver from active list on disconnect
      for (const driverId in activeDrivers) {
        if (activeDrivers[driverId].socketId === socket.id) {
          console.log(`Driver ${driverId} disconnected`);
          delete activeDrivers[driverId];
          break;
        }
      }

      // Optionally remove the user booking when they disconnect (if needed)
      for (const bookingId in activeUserBookings) {
        if (activeUserBookings[bookingId] === socket.id) {
          delete activeUserBookings[bookingId];
          break;
        }
      }
    });
  });
};
function emitBookingRequest(newDriver: Driver, bookingData: BookingData, arg2: number) {
  throw new Error('Function not implemented.');
}

