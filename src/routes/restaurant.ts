import express, { Request, Response } from 'express';
import Restaurant from '../db/models/restaurant'; // Adjust the path to your Restaurant model
import Image from '../db/models/image';
import redisClient from '../../src/redis/redis'

const restaurantRouter = express.Router();

// Create a new restaurant
restaurantRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { name, location, phone, rating, opening_time, closing_time, image_id } = req.body;

    if (image_id) {
      const imageExists = await Image.findByPk(image_id);
      if (!imageExists) {
        return res.status(400).json({ error: 'Image ID does not exist' });
      }
    }
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
  const { id } = req.params;
  const cacheKey = `restaurant:${id}`;

  try {
      // Check if the restaurant data is already in Redis
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

          // Fetch the restaurant data from the database
          const restaurant = await Restaurant.findByPk(id, {
              include: [
                  { model: Image, as: 'image' }
              ],
          });

          if (!restaurant) {
              return res.status(404).send({ message: 'Restaurant not found.' });
          }

          // Store the restaurant data in Redis with an expiration time of 3 minutes
          await redisClient.set(cacheKey, JSON.stringify(restaurant));
          await redisClient.expire(cacheKey, 2);

          // Respond with the restaurant data
          res.status(200).send(restaurant);
      });
  } catch (error: any) {
      console.error('Error in fetching restaurant by ID:', error);
      res.status(500).send({ message: `Error in fetching restaurant: ${error.message}` });
  }
});


// Get all restaurants
restaurantRouter.get('/', async (req: Request, res: Response) => {
  const { id } = req.query; // Use query instead of params for filtering
  const cacheKey = id ? `restaurants:category:${id}` : 'restaurants:all'; // Dynamic cache key based on query parameter

  try {
      // Check if the restaurants data is already in Redis
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

          // Fetch the restaurants data from the database
          const restaurants = await Restaurant.findAll({
              include: [
                  { model: Image, as: 'image' }
              ],
              where: id ? { '$category.category_id$': id } : undefined,
          });

          // Store the restaurants data in Redis with an expiration time of 3 minutes
          await redisClient.set(cacheKey, JSON.stringify(restaurants));
          await redisClient.expire(cacheKey, 2);

          // Respond with the restaurants data
          res.status(200).send(restaurants);
      });
  } catch (error: any) {
      console.error('Error in fetching restaurants:', error);
      res.status(500).send({ message: `Error in fetching restaurants: ${error.message}` });
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
