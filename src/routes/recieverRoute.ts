import express, { Request, Response } from 'express';
import ReceiverDetails from '../db/models/recieverdetails';

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
    try {
        const receiverDetails = await ReceiverDetails.findAll();

        return res.status(200).send(receiverDetails);
    } catch (error: any) {
        console.error('Error in fetching receiver details:', error);
        return res.status(500).send({ message: `Error in fetching receiver details: ${error.message}` });
    }
});

// Get a receiver detail by ID
ReceiverDetailsRouter.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const receiverDetail = await ReceiverDetails.findOne({ where: { receiver_id: id } });

        if (!receiverDetail) {
            return res.status(404).send({ message: 'Receiver detail not found.' });
        }

        return res.status(200).send(receiverDetail);
    } catch (error: any) {
        console.error('Error in fetching receiver detail by ID:', error);
        return res.status(500).send({ message: `Error in fetching receiver detail: ${error.message}` });
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
