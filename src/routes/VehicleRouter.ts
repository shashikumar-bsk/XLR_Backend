import express, { Request, Response } from 'express';
import Vehicle from '../db/models/vehicle';

const VehicleRouter = express.Router();
function isError(error: unknown): error is Error {
  return error instanceof Error;
}

// Create a new vehicle
VehicleRouter.post('/post', async (req: Request, res: Response) => {
  try {
    const { name, capacity, image, price } = req.body;
    const vehicle = await Vehicle.create({ name, capacity, image, price });
    res.status(201).json(vehicle);
  } catch (error) {
    if (isError(error)) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

// Get all vehicles
VehicleRouter.get('/vehicles', async (req: Request, res: Response) => {
  try {
    const vehicles = await Vehicle.findAll();
    res.status(200).json(vehicles);
  } catch (error) {
    if (isError(error)) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

// Get a vehicle by ID
VehicleRouter.get('/vehicles/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findByPk(id);
    if (vehicle) {
      res.status(200).json(vehicle);
    } else {
      res.status(404).json({ error: 'Vehicle not found' });
    }
  } catch (error) {
    if (isError(error)) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

// Update a vehicle by ID
VehicleRouter.put('/vehicles/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, capacity, image, price } = req.body;
    const vehicle = await Vehicle.findByPk(id);
    if (vehicle) {
      await vehicle.update({ name, capacity, image, price });
      res.status(200).json(vehicle);
    } else {
      res.status(404).json({ error: 'Vehicle not found' });
    }
  } catch (error) {
    if (isError(error)) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

// Delete a vehicle by ID
VehicleRouter.delete('/vehicles/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findByPk(id);
    if (vehicle) {
      await vehicle.destroy();
      res.status(204).end();
    } else {
      res.status(404).json({ error: 'Vehicle not found' });
    }
  } catch (error) {
    if (isError(error)) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
  }
});

export default VehicleRouter;