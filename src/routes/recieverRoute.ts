import express, { Request, Response } from 'express';
import ReceiverDetails from '../db/models/recieverdetails';
import redisClient from '../../src/redis/redis'

const ReceiverDetailsRouter = express.Router();

// Create a new receiver detail
ReceiverDetailsRouter.post('/', async (req: Request, res: Response) => {
    try {
        const { receiver_name, receiver_phone_number, user_id } = req.body;

        // Validate required fields
        if (!receiver_name || !receiver_phone_number || !user_id) {
            return res.status(400).send({ message: 'Please fill in all required fields.' });
        }

        // Create receiver detail
        const receiverDetail = await ReceiverDetails.create({ receiver_name, receiver_phone_number, user_id });

        return res.status(200).send({ message: 'Receiver detail created successfully', data: receiverDetail });
    } catch (error: any) {
        console.error('Error in creating receiver detail:', error);
        return res.status(500).send({ message: `Error in creating receiver detail: ${error.message}` });
    }
});

// Get all receiver details
ReceiverDetailsRouter.get('/', async (req: Request, res: Response) => {
    const cacheKey = 'receiverDetails';

    try {
        // Check if the receiver details data is already in Redis
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

            // Fetch the receiver details data from the database
            const receiverDetails = await ReceiverDetails.findAll();

            // Store the receiver details data in Redis with an expiration time of 5 minutes
            await redisClient.set(cacheKey, JSON.stringify(receiverDetails));
            await redisClient.expire(cacheKey, 120);

            // Respond with the receiver details data
            res.status(200).send(receiverDetails);
        });
    } catch (error: any) {
        console.error('Error in fetching receiver details:', error);
        res.status(500).send({ message: `Error in fetching receiver details: ${error.message}` });
    }
});


// Get a receiver detail by ID
ReceiverDetailsRouter.get('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const cacheKey = `receiverDetail:${id}`;

    try {
        // Check if the receiver detail data is already in Redis
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

            // Fetch the receiver detail data from the database
            const receiverDetail = await ReceiverDetails.findOne({ where: { receiver_id: id } });

            if (!receiverDetail) {
                return res.status(404).send({ message: 'Receiver detail not found.' });
            }

            // Store the receiver detail data in Redis with an expiration time of 3 minutes
            await redisClient.set(cacheKey, JSON.stringify(receiverDetail));
            await redisClient.expire(cacheKey, 120);

            // Respond with the receiver detail data
            res.status(200).send(receiverDetail);
        });
    } catch (error: any) {
        console.error('Error in fetching receiver detail by ID:', error);
        res.status(500).send({ message: `Error in fetching receiver detail: ${error.message}` });
    }
});


// Update a receiver detail
ReceiverDetailsRouter.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { receiver_name, receiver_phone_number, user_id } = req.body;

        const receiverDetail = await ReceiverDetails.findOne({ where: { receiver_id: id } });
        if (!receiverDetail) {
            return res.status(404).send({ message: 'Receiver detail not found.' });
        }

        // Update receiver detail
        await ReceiverDetails.update({ receiver_name, receiver_phone_number, user_id }, { where: { receiver_id: id } });

        return res.status(200).send({ message: 'Receiver detail updated successfully' });
    } catch (error: any) {
        console.error('Error in updating receiver detail:', error);
        return res.status(500).send({ message: `Error in updating receiver detail: ${error.message}` });
    }
});

// Delete (soft delete) a receiver detail
ReceiverDetailsRouter.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const receiverDetail = await ReceiverDetails.findOne({ where: { receiver_id: id } });
        if (!receiverDetail) {
            return res.status(404).send({ message: 'Receiver detail not found.' });
        }

        // Soft delete receiver detail
        await ReceiverDetails.destroy({ where: { receiver_id: id } });

        return res.status(200).send({ message: 'Receiver detail deleted successfully' });
    } catch (error: any) {
        console.error('Error in deleting receiver detail:', error);
        return res.status(500).send({ message: `Error in deleting receiver detail: ${error.message}` });
    }
});

export default ReceiverDetailsRouter;
