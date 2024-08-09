import express, { Request, Response } from 'express';
import Restaurant from '../db/models/restaurant'; // Adjust the path to your Restaurant model

const restaurantRouter = express.Router();

// Create a new restaurant
restaurantRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { name, location, phone, rating, opening_time, closing_time, image_id } = req.body;

    // Basic validation
    if (!name || !location) {
      return res.status(400).json({ success: false, error: 'Name and location are required' });
    }

    const newRestaurant = await Restaurant.create({
      name,
      location,
      phone,
      rating,
      opening_time,
      closing_time,
      image_id
    });

    res.status(201).json({ success: true, data: newRestaurant });
  } catch (err) {
    console.error('Error in /restaurants:', err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// Get restaurant by ID
restaurantRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const restaurant = await Restaurant.findByPk(id);

    if (!restaurant) {
      return res.status(404).send({ message: 'Restaurant not found.' });
    }

    return res.status(200).send(restaurant);
  } catch (error: any) {
    console.error('Error in fetching restaurant by ID:', error);
    return res.status(500).send({ message: `Error in fetching restaurant: ${error.message}` });
  }
});

// Get all restaurants
restaurantRouter.get('/', async (req: Request, res: Response) => {
  try {
    const restaurants = await Restaurant.findAll();

    return res.status(200).send(restaurants);
  } catch (error: any) {
    console.error('Error in fetching restaurants:', error);
    return res.status(500).send({ message: `Error in fetching restaurants: ${error.message}` });
  }
});

// Update restaurant
restaurantRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, location, phone, rating, opening_time, closing_time, image_id } = req.body;

    const [updated] = await Restaurant.update(
      { name, location, phone, rating, opening_time, closing_time, image_id },
      { where: { id } }
    );

    if (updated) {
      const updatedRestaurant = await Restaurant.findByPk(id);
      return res.status(200).send(updatedRestaurant);
    } else {
      return res.status(404).send({ message: 'Restaurant not found.' });
    }
  } catch (error: any) {
    console.error('Error in updating restaurant:', error);
    return res.status(500).send({ message: `Error in updating restaurant: ${error.message}` });
  }
});

// Delete restaurant
restaurantRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const restaurant = await Restaurant.findByPk(id);
    if (!restaurant) {
      return res.status(404).send({ message: 'Restaurant not found.' });
    }

    // Hard delete restaurant
    await Restaurant.destroy({ where: { id } });

    return res.status(200).send({ message: 'Restaurant deleted successfully' });
  } catch (error: any) {
    console.error('Error in deleting restaurant:', error);
    return res.status(500).send({ message: `Error in deleting restaurant: ${error.message}` });
  }
});

export default restaurantRouter;
