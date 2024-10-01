import express from 'express';
import Vehicle from '../db/models/Vehicles'; // Adjust the path to your Vehicle model

const VehicleRouter = express.Router();

// Create a new Vehicle
VehicleRouter.post('/', async (req, res) => {
  try {
    const vehicle = await Vehicle.create(req.body);
    return res.status(201).json(vehicle);
  } catch (error:any) {
    return res.status(400).json({ error: error.message });
  }
});

// Get all Vehicles
VehicleRouter.get('/', async (req, res) => {
  try {
    const vehicles = await Vehicle.findAll();
    return res.status(200).json(vehicles);
  } catch (error:any) {
    return res.status(500).json({ error: error.message });
  }
});

// Get a Vehicle by ID
VehicleRouter.get('/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (vehicle) {
      return res.status(200).json(vehicle);
    } else {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
  } catch (error:any) {
    return res.status(500).json({ error: error.message });
  }
});

// Update a Vehicle by ID
VehicleRouter.put('/:id', async (req, res) => {
  try {
    const [updated] = await Vehicle.update(req.body, {
      where: { id: req.params.id }
    });
    if (updated) {
      const updatedVehicle = await Vehicle.findByPk(req.params.id);
      return res.status(200).json(updatedVehicle);
    }
    return res.status(404).json({ error: 'Vehicle not found' });
  } catch (error:any) {
    return res.status(400).json({ error: error.message });
  }
});

// Delete a Vehicle by ID
VehicleRouter.delete('/:id', async (req, res) => {
  try {
    const deleted = await Vehicle.destroy({
      where: { id: req.params.id }
    });
    if (deleted) {
      return res.status(204).send(); // No content
    }
    return res.status(404).json({ error: 'Vehicle not found' });
  } catch (error:any) {
    return res.status(500).json({ error: error.message });
  }
});

export default VehicleRouter;
