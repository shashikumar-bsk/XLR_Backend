import express, { Request, Response } from 'express';
import Category from '../db/models/Category';
import SuperCategory from '../db/models/SuperCategory';
import Image from '../db/models/image';
import redisClient from '../../src/redis/redis'

const CategoryRouter = express.Router();

// Create Category
CategoryRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { super_category_id, name, description, image_id } = req.body;
    
    // Validate if SuperCategory exists
    const superCategory = await SuperCategory.findByPk(super_category_id);
    if (!superCategory) {
      return res.status(400).send({ message: 'Invalid super_category_id' });
    }

    // Validate if Image exists (if provided)
    if (image_id) {
      const image = await Image.findByPk(image_id);
      if (!image) {
        return res.status(400).send({ message: 'Invalid image_id' });
      }
    }

    const newCategory = await Category.create({ super_category_id, name, description, image_id });
    res.status(201).send(newCategory);
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
});

// Get all Categories

CategoryRouter.get('/', async (req: Request, res: Response) => {
  try {
    // Check if categories are already cached in Redis
    redisClient.get('categories', async (err, cachedData) => {
      if (err) {
        console.error('Redis error:', err);
        return res.status(500).send({ message: 'Internal server error.' });
      }

      if (cachedData) {
        // If data is found in Redis, parse and return it
        console.log('Cache hit, returning data from Redis');
        return res.status(200).send(JSON.parse(cachedData));
      }

      // If data is not in Redis, fetch from the database
      const categories = await Category.findAll({
        include: [
          { model: SuperCategory, as: 'superCategory' },
          { model: Image, as: 'image' }
        ]
      });

      if (categories.length === 0) {
        return res.status(404).send({ message: 'No categories found.' });
      }

      // Store the fetched categories in Redis with a 2 seconds expiration
      await redisClient.set('categories', JSON.stringify(categories));
      await redisClient.expire('categories', 2);

      // Respond with the categories
      res.status(200).send(categories);
    });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    res.status(500).send({ message: `Error fetching categories: ${error.message}` });
  }
});


// Get Category by ID

CategoryRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if the category is cached in Redis
    redisClient.get(`category:${id}`, async (err, cachedData) => {
      if (err) {
        console.error('Redis error:', err);
        return res.status(500).send({ message: 'Internal server error.' });
      }

      if (cachedData) {
        // If data is found in Redis, parse and return it
        console.log('Cache hit, returning data from Redis');
        return res.status(200).send(JSON.parse(cachedData));
      }

      // If data is not in Redis, fetch from the database
      const category = await Category.findByPk(id, {
        include: [
          { model: SuperCategory, as: 'superCategory' },
          { model: Image, as: 'image' }
        ]
      });

      if (!category) {
        return res.status(404).send({ message: 'Category not found' });
      }

      // Store the fetched category in Redis with a 2 seconds expiration
      await redisClient.set(`category:${id}`, JSON.stringify(category));
      await redisClient.expire(`category:${id}`, 2);

      // Respond with the category
      res.status(200).send(category);
    });
  } catch (error: any) {
    console.error('Error fetching category:', error);
    res.status(500).send({ message: `Error fetching category: ${error.message}` });
  }
});


export default CategoryRouter;
