import express, { Request, Response } from 'express';
import SuperCategory from '../db/models/SuperCategory';
import redisClient from '../../src/redis/redis'

const SuperCategoryRouter = express.Router();

// Create SuperCategory
SuperCategoryRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const newSuperCategory = await SuperCategory.create({ name, description });
    res.status(201).send(newSuperCategory);
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
});

// Get all SuperCategories
SuperCategoryRouter.get('/', async (req: Request, res: Response) => {
  const cacheKey = 'superCategories'; // Define a cache key for all supercategories

  try {
    // Check if the supercategories data is already in Redis
    redisClient.get(cacheKey, async (err, cachedData) => {
      if (err) {
        console.error('Redis error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (cachedData) {
        // If data is found in Redis, parse and return it
        console.log('Cache hit, returning data from Redis');
        return res.status(200).json(JSON.parse(cachedData));
      }

      // Fetch the supercategories data from the database
      const superCategories = await SuperCategory.findAll();

      // Store the supercategories data in Redis with an expiration time of 2 seconds
      await redisClient.set(cacheKey, JSON.stringify(superCategories));
      await redisClient.expire(cacheKey, 2);

      // Respond with the supercategories data
      res.status(200).json(superCategories);
    });
  } catch (error: any) {
    console.error('Error in fetching supercategories:', error);
    res.status(500).json({ error: `Internal Server Error: ${error.message}` });
  }
});


// Get SuperCategory by ID
SuperCategoryRouter.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const cacheKey = `superCategory:${id}`; // Define a cache key for the specific supercategory

  try {
    // Check if the supercategory data is already in Redis
    redisClient.get(cacheKey, async (err, cachedData) => {
      if (err) {
        console.error('Redis error:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (cachedData) {
        // If data is found in Redis, parse and return it
        console.log('Cache hit, returning data from Redis');
        return res.status(200).json(JSON.parse(cachedData));
      }

      // Fetch the supercategory data from the database
      const superCategory = await SuperCategory.findByPk(id);
      if (!superCategory) {
        return res.status(404).json({ message: 'SuperCategory not found' });
      }

      // Store the supercategory data in Redis with an expiration time of 2 seconds
      await redisClient.set(cacheKey, JSON.stringify(superCategory));
      await redisClient.expire(cacheKey, 2);

      // Respond with the supercategory data
      res.status(200).json(superCategory);
    });
  } catch (error: any) {
    console.error('Error in fetching supercategory by ID:', error);
    res.status(500).json({ error: `Internal Server Error: ${error.message}` });
  }
});


export default SuperCategoryRouter;
