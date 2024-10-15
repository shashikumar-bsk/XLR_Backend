import express, { Request, Response } from 'express';
import Dish from '../db/models/dish'; // Adjust the path to your Dish model
import Image from '../db/models/image'; // Adjust the path to your Image model
import redisClient from '../../src/redis/redis'; // Adjust the path to your Redis config

const dishRouter = express.Router();

// Create a new dish
dishRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { restaurant_id, name, description, price, image_id, availability } = req.body;

    // Basic validation
    if (!restaurant_id || !name || !price || !image_id) {
      return res.status(400).json({ success: false, error: 'Required fields are missing' });
    }

    const newDish = await Dish.create({
      restaurant_id,
      name,
      description,
      price,
      image_id,
      availability: availability ?? true, // Default to true if not provided
    });

    res.status(201).json({ success: true, data: transformDishOutput(newDish) });
  } catch (err) {
    console.error('Error in creating dish:', err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// Get a dish by ID
dishRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if the dish is cached in Redis
    redisClient.get(`dish:${id}`, async (err, cachedData) => {
      if (err) {
        console.error('Redis error:', err);
        return res.status(500).send({ message: 'Internal server error.' });
      }

      if (cachedData) {
        console.log('Cache hit, returning data from Redis');
        return res.status(200).send(JSON.parse(cachedData));
      }

      // If data is not in Redis, fetch from the database
      const dish = await Dish.findByPk(id, { include: [{ model: Image, as: 'image' }] });

      if (!dish) {
        return res.status(404).send({ message: 'Dish not found.' });
      }

      const transformedDish = transformDishOutput(dish);

      // Store the fetched dish in Redis with a 2 seconds expiration
      await redisClient.set(`dish:${id}`, JSON.stringify(transformedDish));
      await redisClient.expire(`dish:${id}`, 2);

      return res.status(200).send(transformedDish);
    });
  } catch (error: any) {
    console.error('Error in fetching dish by ID:', error);
    return res.status(500).send({ message: `Error in fetching dish: ${error.message}` });
  }
});

// Get all dishes
dishRouter.get('/', async (req: Request, res: Response) => {
  try {
    // Check if dishes are cached in Redis
    redisClient.get('dishes', async (err, cachedData) => {
      if (err) {
        console.error('Redis error:', err);
        return res.status(500).send({ message: 'Internal server error.' });
      }

      if (cachedData) {
        console.log('Cache hit, returning data from Redis');
        return res.status(200).send(JSON.parse(cachedData));
      }

      const dishes = await Dish.findAll({ include: [{ model: Image, as: 'image' }] });

      if (!dishes.length) {
        return res.status(404).send({ message: 'No dishes found.' });
      }

      const transformedDishes = dishes.map(transformDishOutput);

      // Store the fetched dishes in Redis with a 2 seconds expiration
      await redisClient.set('dishes', JSON.stringify(transformedDishes));
      await redisClient.expire('dishes', 2);

      return res.status(200).send(transformedDishes);
    });
  } catch (error: any) {
    console.error('Error in fetching dishes:', error);
    return res.status(500).send({ message: `Error in fetching dishes: ${error.message}` });
  }
});

// Get all dishes by restaurant ID
dishRouter.get('/restaurant/:restaurant_id', async (req: Request, res: Response) => {
  const { restaurant_id } = req.params;

  try {
    redisClient.get(`dishesByRestaurant:${restaurant_id}`, async (err, cachedData) => {
      if (err) {
        console.error('Redis error:', err);
        return res.status(500).send({ message: 'Internal server error.' });
      }

      if (cachedData) {
        console.log('Cache hit, returning data from Redis');
        return res.status(200).send(JSON.parse(cachedData));
      }

      const dishes = await Dish.findAll({
        where: { restaurant_id },
        include: [{ model: Image, as: 'image' }],
      });

      if (!dishes.length) {
        return res.status(404).send({ message: 'No dishes found for this restaurant.' });
      }

      const transformedDishes = dishes.map(transformDishOutput);

      // Store the fetched dishes in Redis with a 2seconds expiration
      await redisClient.set(`dishesByRestaurant:${restaurant_id}`, JSON.stringify(transformedDishes));
      await redisClient.expire(`dishesByRestaurant:${restaurant_id}`, 2);

      return res.status(200).send(transformedDishes);
    });
  } catch (error: any) {
    console.error('Error in fetching dishes by restaurant ID:', error);
    return res.status(500).send({ message: `Error in fetching dishes: ${error.message}` });
  }
});

// Update a dish by ID
dishRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { restaurant_id, name, description, price, image_id, availability } = req.body;

    const [updated] = await Dish.update(
      { restaurant_id, name, description, price, image_id, availability },
      { where: { id } }
    );

    if (updated) {
      const updatedDish = await Dish.findByPk(id, { include: [{ model: Image, as: 'image' }] });
      return res.status(200).send(transformDishOutput(updatedDish));
    } else {
      return res.status(404).send({ message: 'Dish not found.' });
    }
  } catch (error: any) {
    console.error('Error in updating dish:', error);
    return res.status(500).send({ message: `Error in updating dish: ${error.message}` });
  }
});

// Delete a dish by ID
dishRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const dish = await Dish.findByPk(id);
    if (!dish) {
      return res.status(404).send({ message: 'Dish not found.' });
    }

    await Dish.destroy({ where: { id } });
    return res.status(200).send({ message: 'Dish deleted successfully' });
  } catch (error: any) {
    console.error('Error in deleting dish:', error);
    return res.status(500).send({ message: `Error in deleting dish: ${error.message}` });
  }
});

// Helper function to transform the dish output
function transformDishOutput(dish: any) {
  if (!dish) return null;
  const { id, restaurant_id, name, description, price, availability, createdAt, updatedAt, image } = dish;

  return {
    id,
    restaurant_id,
    name,
    description,
    price,
    availability, // Include availability in the response
    createdAt,
    updatedAt,
    imageUrl: image ? image.image_url : null,
  };
}

export default dishRouter;
