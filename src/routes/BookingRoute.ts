import express, { Request, Response } from 'express';
import Booking from '../db/models/booking';

const bookingRouter = express.Router();

// Create a new booking
bookingRouter.post('/', async (req: Request, res: Response) => {
    try {
        const { user_id, service_id, pickup_address, dropoff_address } = req.body;

        // Validate required fields
        if (!user_id || !service_id || !pickup_address || !dropoff_address) {
            return res.status(400).send({ message: 'Please fill in all required fields.' });
        }

        // Create booking
        const booking = await Booking.create({ user_id, service_id, pickup_address, dropoff_address });

        return res.status(200).send({ message: 'Booking created successfully', data: booking });
    } catch (error: any) {
        console.error('Error in creating booking:', error);
        return res.status(500).send({ message: `Error in creating booking: ${error.message}` });
    }
});

// Get all bookings
bookingRouter.get('/', async (req: Request, res: Response) => {
    try {
        const bookings = await Booking.findAll();

        return res.status(200).send(bookings);
    } catch (error: any) {
        console.error('Error in fetching bookings:', error);
        return res.status(500).send({ message: `Error in fetching bookings: ${error.message}` });
    }
});

// Get a booking by ID
bookingRouter.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const booking = await Booking.findOne({
            where: { booking_id: id }
        });

        if (!booking) {
            return res.status(404).send({ message: 'Booking not found.' });
        }

        return res.status(200).send(booking);
    } catch (error: any) {
        console.error('Error in fetching booking by ID:', error);
        return res.status(500).send({ message: `Error in fetching booking: ${error.message}` });
    }
});

// Update a booking
bookingRouter.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { user_id, service_id, pickup_address, dropoff_address } = req.body;

        const booking = await Booking.findOne({
            where: { booking_id: id }
        });
        if (!booking) {
            return res.status(404).send({ message: 'Booking not found.' });
        }

        // Update booking
        await Booking.update({ user_id, service_id, pickup_address, dropoff_address }, {
            where: { booking_id: id }
        });

        return res.status(200).send({ message: 'Booking updated successfully' });
    } catch (error: any) {
        console.error('Error in updating booking:', error);
        return res.status(500).send({ message: `Error in updating booking: ${error.message}` });
    }
});

// Delete a booking
bookingRouter.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const booking = await Booking.findOne({
            where: { booking_id: id }
        });
        if (!booking) {
            return res.status(404).send({ message: 'Booking not found.' });
        }

        // Delete booking
        await Booking.destroy({
            where: { booking_id: id }
        });

        return res.status(200).send({ message: 'Booking deleted successfully' });
    } catch (error: any) {
        console.error('Error in deleting booking:', error);
        return res.status(500).send({ message: `Error in deleting booking: ${error.message}` });
    }
});

export default bookingRouter;
