import express, { Request, Response } from 'express';
import Dish from '../db/models/dish'; // Adjust the path to your Dish model
import Restaurant from '../db/models/restaurant'; // Ensure Restaurant is imported correctly
import Image from '../db/models/image'; // Ensure Image is imported correctly

const dishRouter = express.Router();

// Create a new dish
dishRouter.post('/', async (req: Request, res: Response) => {
    try {
        const { restaurant_id, name, description, price, image_id } = req.body;

        // Basic validation
        if (!restaurant_id || !name || !price || !image_id) {
            return res.status(400).json({ error: 'Restaurant ID, name, price, and image ID are required' });
        }

        const newDish = await Dish.create({
            restaurant_id,
            name,
            description,
            price,
            image_id
        });
        res.status(201).json(newDish);
    } catch (error) {
        console.error('Error creating dish:', error);
        res.status(500).json({ error: 'Failed to create dish' });
    }
});

// Get all dishes
dishRouter.get('/', async (req: Request, res: Response) => {
    try {
        const dishes = await Dish.findAll({
            include: [
                {
                    model: Restaurant,
                    as: 'restaurant',
                    attributes: ['id', 'name'] // Adjust attributes as needed
                },
                {
                    model: Image,
                    attributes: ['id', 'url'] // Adjust attributes as needed
                }
            ]
        });
        const dishOutput = dishes.map(dish => dish.get({ plain: true }));
        res.status(200).json(dishOutput);
    } catch (error) {
        console.error('Error fetching dishes:', error);
        res.status(500).json({ error: 'Failed to fetch dishes' });
    }
});

// Get a dish by ID
dishRouter.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const dish = await Dish.findByPk(id, {
            include: [
                {
                    model: Restaurant,
                    as: 'restaurant',
                    attributes: ['id', 'name'] // Adjust attributes as needed
                },
                {
                    model: Image,
                    attributes: ['id', 'url'] // Adjust attributes as needed
                }
            ]
        });
        if (dish) {
            const dishOutput = dish.get({ plain: true });
            res.status(200).json(dishOutput);
        } else {
            res.status(404).json({ error: 'Dish not found' });
        }
    } catch (error) {
        console.error('Error fetching dish:', error);
        res.status(500).json({ error: 'Failed to fetch dish' });
    }
});

// Update a dish by ID
dishRouter.patch('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { restaurant_id, name, description, price, image_id } = req.body;

        // Basic validation
        if (!name && !price && !restaurant_id && !description && !image_id) {
            return res.status(400).json({ error: 'At least one field is required to update' });
        }

        const [updated] = await Dish.update({
            restaurant_id,
            name,
            description,
            price,
            image_id
        }, {
            where: { id },
            returning: true
        });

        if (updated) {
            const updatedDish = await Dish.findByPk(id, {
                include: [
                    {
                        model: Restaurant,
                        as: 'restaurant',
                        attributes: ['id', 'name'] // Adjust attributes as needed
                    },
                    {
                        model: Image,
                        attributes: ['id', 'url'] // Adjust attributes as needed
                    }
                ]
            });
            if (updatedDish) {
                const dishOutput = updatedDish.get({ plain: true });
                res.status(200).json(dishOutput);
            } else {
                res.status(404).json({ error: 'Dish not found' });
            }
        } else {
            res.status(404).json({ error: 'Dish not found' });
        }
    } catch (error) {
        console.error('Error updating dish:', error);
        res.status(500).json({ error: 'Failed to update dish' });
    }
});

// Delete a dish by ID
dishRouter.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deleted = await Dish.destroy({
            where: { id }
        });
        if (deleted) {
            res.status(204).send();
        } else {
            res.status(404).json({ error: 'Dish not found' });
        }
    } catch (error) {
        console.error('Error deleting dish:', error);
        res.status(500).json({ error: 'Failed to delete dish' });
    }
});

export default dishRouter;
