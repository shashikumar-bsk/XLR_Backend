import express, { Request, Response } from 'express';
import RideRequest from '../db/models/riderequest';
import User from '../db/models/users';
import Driver from '../db/models/driver';
import ServiceType from '../db/models/servicetype';
import Booking from '../db/models/booking';
import ReceiverDetails from '../db/models/recieverdetails';

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
  try {
    const { id } = req.params;
    const rideRequest = await RideRequest.findOne({ where: { request_id: id, is_deleted: false } });

    if (!rideRequest) {
      return res.status(404).send({ message: 'Ride request not found.' });
    }

    return res.status(200).send({ data: rideRequest });
  } catch (error: any) {
    console.error('Error in getting ride request:', error);
    return res.status(500).send({ message: `Error in getting ride request: ${error.message}` });
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
  try {
    const rideRequests = await RideRequest.findAll({ where: { is_deleted: false } });
    return res.status(200).send({ data: rideRequests });
  } catch (error: any) {
    console.error('Error in getting all ride requests:', error);
    return res.status(500).send({ message: `Error in getting all ride requests: ${error.message}` });
  }
});

RideRequestRouter.get('/ride-requests/completed', async (req: Request, res: Response) => {
  try {
      const completedRideRequests = await RideRequest.findAll({

          where: { status: 'Completed', is_deleted: false },


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
                attributes: ['receiver_id', 'receiver_name', 'receiver_phone_number']
              }
          ]
      });

      if (completedRideRequests.length === 0) {
          return res.status(404).json({ message: 'No completed ride requests found' });
      }
      
      res.json(completedRideRequests);
  } catch (error) {
      console.error('Error in fetching completed ride requests:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

RideRequestRouter.get('/driver/:driver_id/completed-orders', async (req: Request, res: Response) => {
  try {
    const { driver_id } = req.params;

    const completedOrdersCount = await RideRequest.count({
      where: { driver_id, status: 'Completed', is_deleted: false }
    });

    return res.status(200).json({ completedOrdersCount });
  } catch (error) {
    console.error('Error in fetching completed orders count:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route for fetching missed orders by driver ID
RideRequestRouter.get('/driver/:driver_id/missed-orders', async (req: Request, res: Response) => {
  try {
    const { driver_id } = req.params;

    const MissedOrdersCount = await RideRequest.count({
      where: { driver_id, status: 'rejected', is_deleted: false }
    });

    return res.status(200).json({ MissedOrdersCount });
  } catch (error) {
    console.error('Error in fetching completed orders count:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default RideRequestRouter;
