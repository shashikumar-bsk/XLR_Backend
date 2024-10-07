import express, { Request, Response } from 'express';
import Fare from '../db/models/Fare'; // Adjust the path to your Fare model
import { calculateDistance } from '../db/models/Fare'; // For distance calculation
import Vehicle from '../db/models/Vehicles'; // Adjust path for Vehicle model

const Farerouter = express.Router();

// GET all fares
Farerouter.get('/fares', async (req: Request, res: Response) => {
    try {
        const fares = await Fare.findAll({
            include: [{ model: Vehicle, as: 'vehicle' }],
        });
        return res.status(200).json(fares);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to retrieve fares.' });
    }
});

// GET fare by ID
Farerouter.get('/fares/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const fare = await Fare.findByPk(id, {
            include: [{ model: Vehicle, as: 'vehicle' }],
        });
        if (!fare) {
            return res.status(404).json({ error: 'Fare not found.' });
        }
        return res.status(200).json(fare);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to retrieve fare.' });
    }
});

// CREATE a new fare
Farerouter.post('/fares', async (req: Request, res: Response) => {
    const { vehicleId, basePrice, pricePerKm, discount, estimatedTime } = req.body;
    try {
        const fare = await Fare.create({
            vehicleId,
            basePrice,
            pricePerKm,
            discount,
            finalPrice: basePrice, // Initial final price (updated later)
            estimatedTime,
        });
        return res.status(201).json(fare);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to create fare.' });
    }
});

// UPDATE an existing fare
Farerouter.put('/fares/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { basePrice, pricePerKm, discount, estimatedTime } = req.body;
    try {
        const fare = await Fare.findByPk(id);
        if (!fare) {
            return res.status(404).json({ error: 'Fare not found.' });
        }
        await fare.update({
            basePrice,
            pricePerKm,
            discount,
            estimatedTime,
        });
        return res.status(200).json(fare);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to update fare.' });
    }
});

// DELETE a fare
Farerouter.delete('/fares/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const fare = await Fare.findByPk(id);
        if (!fare) {
            return res.status(404).json({ error: 'Fare not found.' });
        }
        await fare.destroy();
        return res.status(204).json(); // No content, fare deleted
    } catch (error) {
        return res.status(500).json({ error: 'Failed to delete fare.' });
    }
});

// Calculate fare based on distance (pickup and drop-off) and apply discount
Farerouter.post('/fares/calculate', async (req: Request, res: Response) => {
    const { pickupLat, pickupLong, dropLat, dropLong, vehicleId, discount = 0 } = req.body;

    try {
        // Find the vehicle's fare details
        const vehicleFare = await Fare.findOne({ where: { vehicleId } });

        if (!vehicleFare) {
            return res.status(404).json({ error: 'Vehicle fare not found.' });
        }

        // Calculate distance between pickup and drop locations
        const distance = calculateDistance(pickupLat, pickupLong, dropLat, dropLong);

        // Calculate the final fare based on distance and discount
        const finalFare = Fare.calculateFare(
            vehicleFare.basePrice,
            vehicleFare.pricePerKm,
            distance,
            discount
        );

        return res.status(200).json({
            basePrice: vehicleFare.basePrice,
            pricePerKm: vehicleFare.pricePerKm,
            distance,
            discount,
            finalFare,
            estimatedTime: vehicleFare.estimatedTime,
        });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to calculate fare.' });
    }
});

export default Farerouter;
