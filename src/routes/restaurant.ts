import express, { Request, Response } from 'express';
import Restaurant from '../db/models/restaurant'; // Adjust the path to your Restaurant model
import Image from '../db/models/image'; // Ensure Image is imported correctly

const restaurantRouter = express.Router();

// Create a new restaurant
restaurantRouter.post('/', async (req: Request, res: Response) => {
    try {
        const { name, location, phone, rating, opening_time, closing_time, image_id } = req.body;

        // Basic validation
        if (!name || !location || !image_id) {
            return res.status(400).json({ error: 'Name, location, and image ID are required' });
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
        res.status(201).json(newRestaurant);
    } catch (error) {
        console.error('Error creating restaurant:', error);
        res.status(500).json({ error: 'Failed to create restaurant' });
    }
});

// Get all restaurants
restaurantRouter.get('/', async (req: Request, res: Response) => {
    try {
        const restaurants = await Restaurant.findAll({
            include: {
                model: Image,
                attributes: ['id', 'url'] // Adjust attributes as needed
            }
        });
        const restaurantOutput = restaurants.map(restaurant => restaurant.get({ plain: true }));
        res.status(200).json(restaurantOutput);
    } catch (error) {
        console.error('Error fetching restaurants:', error);
        res.status(500).json({ error: 'Failed to fetch restaurants' });
    }
});

// Get a restaurant by ID
restaurantRouter.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const restaurant = await Restaurant.findByPk(id, {
            include: {
                model: Image,
                attributes: ['id', 'url'] // Adjust attributes as needed
            }
        });
        if (restaurant) {
            const restaurantOutput = restaurant.get({ plain: true });
            res.status(200).json(restaurantOutput);
        } else {
            res.status(404).json({ error: 'Restaurant not found' });
        }
    } catch (error) {
        console.error('Error fetching restaurant:', error);
        res.status(500).json({ error: 'Failed to fetch restaurant' });
    }
});

// Update a restaurant by ID
restaurantRouter.patch('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, location, phone, rating, opening_time, closing_time, image_id } = req.body;

        // Basic validation
        if (!name && !location && !phone && !rating && !opening_time && !closing_time && !image_id) {
            return res.status(400).json({ error: 'At least one field is required to update' });
        }

        const [updated] = await Restaurant.update({
            name,
            location,
            phone,
            rating,
            opening_time,
            closing_time,
            image_id
        }, {
            where: { id },
            returning: true
        });

        if (updated) {
            const updatedRestaurant = await Restaurant.findByPk(id, {
                include: {
                    model: Image,
                    attributes: ['id', 'url'] // Adjust attributes as needed
                }
            });
            if (updatedRestaurant) {
                const restaurantOutput = updatedRestaurant.get({ plain: true });
                res.status(200).json(restaurantOutput);
            } else {
                res.status(404).json({ error: 'Restaurant not found' });
            }
        } else {
            res.status(404).json({ error: 'Restaurant not found' });
        }
    } catch (error) {
        console.error('Error updating restaurant:', error);
        res.status(500).json({ error: 'Failed to update restaurant' });
    }
});

// Delete a restaurant by ID
restaurantRouter.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deleted = await Restaurant.destroy({
            where: { id }
        });
        if (deleted) {
            res.status(204).send();
        } else {
            res.status(404).json({ error: 'Restaurant not found' });
        }
    } catch (error) {
        console.error('Error deleting restaurant:', error);
        res.status(500).json({ error: 'Failed to delete restaurant' });
    }
});

export default restaurantRouter;
