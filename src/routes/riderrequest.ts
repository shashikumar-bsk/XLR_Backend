import express, { Request, Response } from 'express';
import RideRequest from '../db/models/riderequest';
import User from '../db/models/users';
import Driver from '../db/models/driver';
import ServiceType from '../db/models/servicetype';
import Booking from '../db/models/booking';
import ReceiverDetails from '../db/models/recieverdetails';
import redisClient from '../../src/redis/redis'

const RideRequestRouter = express.Router();

interface RideDetailsWithAssociations extends RideRequest {
  User: {
    username: string;
    phone: string;
  };
  Driver: {
    driver_name: string;
  };
  Booking: {
    booking_id: string;
    pickup_address: string;
    dropoff_address: string;
  };
  ReceiverDetails: {
    receiver_id: string;
    receiver_name: string;
    receiver_phone_number: string;
  }
}

RideRequestRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { user_id, driver_id, service_type_id, receiver_id, booking_id, status } = req.body;

    // Check if user exists and is not deleted
    const user = await User.findOne({ where: { id: user_id, is_deleted: false } });
    if (!user) {
      return res.status(404).send({ message: 'User not found or is deleted.' });
    }

    // Check if driver exists and is not deleted, only if driver_id is provided
    let driver = null;
    if (driver_id !== null && driver_id !== undefined) {
      driver = await Driver.findOne({ where: { driver_id, is_deleted: false } });
      if (!driver) {
        return res.status(404).send({ message: 'Driver not found or is deleted.' });
      }
    }

    // Check if service type exists
    const serviceType = await ServiceType.findOne({ where: { service_id: service_type_id } });
    if (!serviceType) {
      return res.status(404).send({ message: 'Service type not found.' });
    }

    // Check if receiver details exist
    const receiverDetails = await ReceiverDetails.findOne({ where: { receiver_id } });
    if (!receiverDetails) {
      return res.status(404).send({ message: 'Receiver details not found.' });
    }

    // Check if booking exists
    const booking = await Booking.findOne({ where: { booking_id } });
    if (!booking) {
      return res.status(404).send({ message: 'Booking not found.' });
    }

    // Create ride request
    const createRideRequestObject = { user_id, driver_id, service_type_id, receiver_id, booking_id, status, is_deleted: false };
    const createRideRequest = await RideRequest.create(createRideRequestObject);

    return res.status(200).send({ message: 'Ride request created successfully', data: createRideRequest });
  } catch (error: any) {
    console.error('Error in creating ride request:', error);
    return res.status(500).send({ message: `Error in creating ride request: ${error.message}` });
  }
});

//Get ride request by ID
RideRequestRouter.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const cacheKey = `rideRequest:${id}`; // Define a cache key based on the request ID

  try {
    // Check if the ride request data is already in Redis
    redisClient.get(cacheKey, async (err, cachedData) => {
      if (err) {
        console.error('Redis error:', err);
        return res.status(500).send({ message: 'Internal server error' });
      }

      if (cachedData) {
        // If data is found in Redis, parse and return it
        console.log('Cache hit, returning data from Redis');
        return res.status(200).send(JSON.parse(cachedData));
      }

      // Fetch the ride request data from the database
      const rideRequest = await RideRequest.findOne({
        where: { request_id: id, is_deleted: false }
      });

      if (!rideRequest) {
        return res.status(404).send({ message: 'Ride request not found.' });
      }

      // Store the ride request data in Redis with an expiration time of 2 seconds
      await redisClient.set(cacheKey, JSON.stringify(rideRequest));
      await redisClient.expire(cacheKey, 2);

      // Respond with the ride request data
      res.status(200).send({ data: rideRequest });
    });
  } catch (error: any) {
    console.error('Error in getting ride request:', error);
    res.status(500).send({ message: `Error in getting ride request: ${error.message}` });
  }
});


// Update a ride request
RideRequestRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id, driver_id, service_type_id, receiver_id, booking_id, status } = req.body;

    // Check if ride request exists
    const rideRequest = await RideRequest.findOne({ where: { request_id: id, is_deleted: false } });
    if (!rideRequest) {
      return res.status(404).send({ message: 'Ride request not found.' });
    }

    // Update ride request
    const updatedRideRequest = await rideRequest.update({ user_id, driver_id, service_type_id, receiver_id, booking_id, status });

    return res.status(200).send({ message: 'Ride request updated successfully', data: updatedRideRequest });
  } catch (error: any) {
    console.error('Error in updating ride request:', error);
    return res.status(500).send({ message: `Error in updating ride request: ${error.message}` });
  }
});

// Delete a ride request
RideRequestRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if ride request exists
    const rideRequest = await RideRequest.findOne({ where: { request_id:id, is_deleted: false } });
    if (!rideRequest) {
      return res.status(404).send({ message: 'Ride request not found.' });
    }

    // Delete ride request
    await rideRequest.destroy();

    return res.status(200).send({ message: 'Ride request deleted successfully' });
  } catch (error: any) {
    console.error('Error in deleting ride request:', error);
    return res.status(500).send({ message: `Error in deleting ride request: ${error.message}` });
  }
});

// Get all ride requests
RideRequestRouter.get('/', async (req: Request, res: Response) => {
  const cacheKey = 'rideRequests'; // Define a cache key for all ride requests

  try {
    // Check if the ride requests data is already in Redis
    redisClient.get(cacheKey, async (err, cachedData) => {
      if (err) {
        console.error('Redis error:', err);
        return res.status(500).send({ message: 'Internal server error' });
      }

      if (cachedData) {
        // If data is found in Redis, parse and return it
        console.log('Cache hit, returning data from Redis');
        return res.status(200).send(JSON.parse(cachedData));
      }

      // Fetch the ride requests data from the database
      const rideRequests = await RideRequest.findAll({ where: { is_deleted: false } });

      // Store the ride requests data in Redis with an expiration time of 2 seconds
      await redisClient.set(cacheKey, JSON.stringify(rideRequests));
      await redisClient.expire(cacheKey, 2);

      // Respond with the ride requests data
      res.status(200).send({ data: rideRequests });
    });
  } catch (error: any) {
    console.error('Error in getting all ride requests:', error);
    res.status(500).send({ message: `Error in getting all ride requests: ${error.message}` });
  }
});


RideRequestRouter.get('/ride-requests/completed', async (req: Request, res: Response) => {
  const cacheKey = 'completedRideRequests'; // Define a cache key for completed ride requests

  try {
    // Check if the completed ride requests data is already in Redis
    redisClient.get(cacheKey, async (err, cachedData) => {
      if (err) {
        console.error('Redis error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (cachedData) {
        // If data is found in Redis, parse and return it
        console.log('Cache hit, returning data from Redis');
        return res.status(200).json(JSON.parse(cachedData));
      }

      // Fetch the completed ride requests data from the database
      const completedRideRequests = await RideRequest.findAll({
        where: { status: 'completed', is_deleted: false },
        attributes: ['request_id', 'status'],
        include: [
          {
            model: User,
            attributes: ['username', 'phone'],
          },
          {
            model: Driver,
            attributes: ['driver_name'],
          },
          {
            model: Booking,
            attributes: ['booking_id', 'pickup_address', 'dropoff_address'],
          },
          {
            model: ReceiverDetails,
            attributes: ['receiver_id', 'receiver_name', 'receiver_phone_number'],
          }
        ]
      });

      if (completedRideRequests.length === 0) {
        return res.status(404).json({ message: 'No completed ride requests found' });
      }

      // Store the completed ride requests data in Redis with an expiration time of 2 seconds
      await redisClient.set(cacheKey, JSON.stringify(completedRideRequests));
      await redisClient.expire(cacheKey, 2);

      // Respond with the completed ride requests data
      res.status(200).json(completedRideRequests);
    });
  } catch (error: any) {
    console.error('Error in fetching completed ride requests:', error);
    res.status(500).json({ error: `Internal Server Error: ${error.message}` });
  }
});



RideRequestRouter.get('/driver/:driver_id/completed-orders', async (req: Request, res: Response) => {
  const { driver_id } = req.params;
  const cacheKey = `completedOrdersCount:${driver_id}`; // Define a cache key based on driver_id

  try {
    // Check if the completed orders count data is already in Redis
    redisClient.get(cacheKey, async (err, cachedData) => {
      if (err) {
        console.error('Redis error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (cachedData) {
        // If data is found in Redis, parse and return it
        console.log('Cache hit, returning data from Redis');
        return res.status(200).json(JSON.parse(cachedData));
      }

      // Fetch the completed orders count from the database
      const completedOrdersCount = await RideRequest.count({
        where: { driver_id, status: 'Completed', is_deleted: false }
      });

      // Store the completed orders count data in Redis with an expiration time of 2 seconds
      await redisClient.set(cacheKey, JSON.stringify({ completedOrdersCount }));
      await redisClient.expire(cacheKey, 2);

      // Respond with the completed orders count data
      res.status(200).json({ completedOrdersCount });
    });
  } catch (error: any) {
    console.error('Error in fetching completed orders count:', error);
    res.status(500).json({ error: `Internal Server Error: ${error.message}` });
  }
});


// Route for fetching missed orders by driver ID
RideRequestRouter.get('/driver/:driver_id/missed-orders', async (req: Request, res: Response) => {
  const { driver_id } = req.params;
  const cacheKey = `missedOrdersCount:${driver_id}`; // Define a cache key based on driver_id

  try {
    // Check if the missed orders count data is already in Redis
    redisClient.get(cacheKey, async (err, cachedData) => {
      if (err) {
        console.error('Redis error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (cachedData) {
        // If data is found in Redis, parse and return it
        console.log('Cache hit, returning data from Redis');
        return res.status(200).json(JSON.parse(cachedData));
      }

      // Fetch the missed orders count from the database
      const missedOrdersCount = await RideRequest.count({
        where: { driver_id, status: 'rejected', is_deleted: false }
      });

      // Store the missed orders count data in Redis with an expiration time of 2 seconds
      await redisClient.set(cacheKey, JSON.stringify({ missedOrdersCount }));
      await redisClient.expire(cacheKey, 2);

      // Respond with the missed orders count data
      res.status(200).json({ missedOrdersCount });
    });
  } catch (error: any) {
    console.error('Error in fetching missed orders count:', error);
    res.status(500).json({ error: `Internal Server Error: ${error.message}` });
  }
});


// Get orders for a specific user
RideRequestRouter.get('/user/:user_id', async (req: Request, res: Response) => {
  const { user_id } = req.params;
  const cacheKey = `rideRequests:${user_id}`; // Define a cache key based on user_id

  try {
    // Check if the ride requests data is already in Redis
    redisClient.get(cacheKey, async (err, cachedData) => {
      if (err) {
        console.error('Redis error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (cachedData) {
        // If data is found in Redis, parse and return it
        console.log('Cache hit, returning data from Redis');
        return res.status(200).json(JSON.parse(cachedData));
      }

      // Fetch the ride requests data from the database
      const getOrderDetails = await RideRequest.findAll({
        where: { user_id: Number(user_id), is_deleted: false },
        attributes: ['request_id', 'status'],
        include: [
          {
            model: User,
            attributes: ['id', 'username'],
          },
          {
            model: Driver,
            attributes: ['driver_id', 'driver_name', 'vehicle_type'],
          },
          {
            model: Booking,
            attributes: ['booking_id', 'pickup_address', 'dropoff_address', 'service_id'],
          },
        ]
      });

      if (getOrderDetails.length === 0) {
        return res.status(404).json({ message: 'No ride requests found' });
      }

      // Store the ride requests data in Redis with an expiration time of 2 seconds
      await redisClient.set(cacheKey, JSON.stringify(getOrderDetails));
      await redisClient.expire(cacheKey, 2);

      // Respond with the ride requests data
      res.status(200).json(getOrderDetails);
    });
  } catch (error: any) {
    console.error('Error in fetching ride requests:', error);
    res.status(500).json({ error: `Internal Server Error: ${error.message}` });
  }
});


export default RideRequestRouter;





