import { Server } from 'socket.io';

export const initializeSocketDriver = (server: any) => {
  const io = new Server(server, {
    cors: {
      origin: "*", // Allow all origins
      methods: ["GET", "POST"],
    },
  });
  return io;
};

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

export const socketHandlersDriver = (io: any) => {
  const drivers: { vehicleType: string; driverId: number; latitude: string; longitude: string }[] = []; // Array to store all driver locations

  io.on("connection", (socket: any) => {
    // console.log("Client connected:", socket.id);

    // Handler for driver location updates
    socket.on("driverLocation", async (data: { vehicleType: string; driverId: number; latitude: string; longitude: string }) => {
      // console.log("Received driver location update:", data);

      // Check if the driver already exists in the array
      const existingDriverIndex = drivers.findIndex(driver => driver.driverId === data.driverId);
      if (existingDriverIndex !== -1) {
        // Update the driver's location if they already exist
        drivers[existingDriverIndex].latitude = data.latitude;
        drivers[existingDriverIndex].longitude = data.longitude;
      } else {
        // Add new driver if they don't exist
        drivers.push(data);
      }

      // Broadcast updated driver locations to all clients (optional, depending on your use case)
      io.emit("driverLocationsUpdated", drivers);
    });

    // Handler for user requesting nearby drivers
    socket.on("requestNearbyDrivers", async (data: { vehicleType: string; driverId: number; latitude: string; longitude: string; radius: number }) => {
      // console.log("User requested nearby drivers:", data);

      // Convert latitude and longitude to floats
      const userLatitude = parseFloat(data.latitude);
      const userLongitude = parseFloat(data.longitude);

      // Filter drivers based on the user's location and the specified radius
      const nearbyDrivers = drivers.filter(driver => {
        const distance = haversineDistance(userLatitude, userLongitude, parseFloat(driver.latitude), parseFloat(driver.longitude));
        return distance <= (data.radius || 5); // Use radius from request or default to 5 km
      });

      // Send the nearby drivers back to the user who requested it
      socket.emit("nearbyDrivers", nearbyDrivers);
    });

    socket.on("disconnect", () => {
      // console.log("Client disconnected:", socket.id);
    });
  });
};