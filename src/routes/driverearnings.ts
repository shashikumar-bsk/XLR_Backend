 import express, { Request, Response } from 'express';
import DriverEarnings from '../db/models/driverearnings';

const driverEarningsRouter = express.Router();

// Middleware to parse JSON bodies
driverEarningsRouter.use(express.json());

// Create a new driver earnings record
driverEarningsRouter.post('/', async (req: Request, res: Response) => {
    try {
        const { driver_id, request_id, earnings } = req.body;

        if (!driver_id || !request_id || !earnings) {
            return res.status(400).send({ message: 'Please provide driver_id, request_id, and earnings.' });
        }

        // Convert earnings to a number if it's not already
        const earningsNumber = parseFloat(earnings);

        // Check if the conversion is successful
        if (isNaN(earningsNumber)) {
            return res.status(400).send({ message: 'Invalid earnings value.' });
        }

        const date = new Date();

        // Create a new driver earnings record
        const driverEarnings = await DriverEarnings.create({
            driver_id,
            request_id,
            date,
            earnings: earningsNumber,
            daily_earnings: earningsNumber,
            monthly_earnings: earningsNumber
        });

        return res.status(201).send({ message: 'Driver earnings created successfully', data: driverEarnings });
    } catch (error: any) {
        console.error('Error in creating driver earnings:', error);
        return res.status(500).send({ message: `Error in creating driver earnings: ${error.message}` });
    }
});

// driverEarningsRouter.post('/', async (req: Request, res: Response) => {
//     try {
//         const { driver_id, request_id, earnings } = req.body;

//         if (!driver_id || !request_id || !earnings) {
//             return res.status(400).send({ message: 'Please provide driver_id, request_id, and earnings.' });
//         }

//         const date = new Date();

//         const driverEarnings = await DriverEarnings.create({
//             driver_id,
//             request_id,
//             date,
//             earnings,
//             daily_earnings: earnings,
//             monthly_earnings: earnings
//         });

//         return res.status(201).send({ message: 'Driver earnings created successfully', data: driverEarnings });
//     } catch (error: any) {
//         console.error('Error in creating driver earnings:', error);
//         return res.status(500).send({ message: `Error in creating driver earnings: ${error.message}` });
//     }
// });

// Get all driver earnings records
driverEarningsRouter.get('/', async (req: Request, res: Response) => {
    try {
        const driverEarnings = await DriverEarnings.findAll();
        return res.status(200).send(driverEarnings);
    } catch (error: any) {
        console.error('Error in fetching driver earnings:', error);
        return res.status(500).send({ message: `Error in fetching driver earnings: ${error.message}` });
    }
});

// Get a driver earnings record by ID
driverEarningsRouter.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const driverEarnings = await DriverEarnings.findByPk(id);

        if (!driverEarnings) {
            return res.status(404).send({ message: 'Driver earnings record not found.' });
        }

        return res.status(200).send(driverEarnings);
    } catch (error: any) {
        console.error('Error in fetching driver earnings by ID:', error);
        return res.status(500).send({ message: `Error in fetching driver earnings: ${error.message}` });
    }
});

driverEarningsRouter.get('/driver/:driver_id', async (req: Request, res: Response) => {
    try {
        const { driver_id } = req.params; // Use driver_id from request params
        const driverEarnings = await DriverEarnings.findOne({ 
            where: { driver_id: driver_id } 
        });

        if (!driverEarnings) {
            return res.status(404).send({ message: 'Driver earnings record not found.' });
        }

        return res.status(200).send(driverEarnings);
    } catch (error: any) {
        console.error('Error in fetching driver earnings by driver_id:', error);
        return res.status(500).send({ message: `Error in fetching driver earnings: ${error.message}` });
    }
});

// Update a driver earnings record
driverEarningsRouter.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { driver_id, request_id, earnings } = req.body;
        const driverEarnings = await DriverEarnings.findByPk(id);

        if (!driverEarnings) {
            return res.status(404).send({ message: 'Driver earnings record not found.' });
        }

        const date = new Date();

        await driverEarnings.update({ driver_id, request_id, date, earnings });
        return res.status(200).send({ message: 'Driver earnings updated successfully', data: driverEarnings });
    } catch (error: any) {
        console.error('Error in updating driver earnings:', error);
        return res.status(500).send({ message: `Error in updating driver earnings: ${error.message}` });
    }
});

// Delete a driver earnings record
driverEarningsRouter.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const driverEarnings = await DriverEarnings.findByPk(id);

        if (!driverEarnings) {
            return res.status(404).send({ message: 'Driver earnings record not found.' });
        }

        await driverEarnings.destroy();
        return res.status(200).send({message: 'Driver earnings deleted successfully'});
    } catch (error: any) {
        console.error('Error in deleting driver earnings:', error);
        return res.status(500).send({ message: `Error in deleting driver earnings: ${error.message}` });
    }
});

export default driverEarningsRouter;
