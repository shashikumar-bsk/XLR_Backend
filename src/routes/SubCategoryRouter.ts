import express, { Request, Response } from 'express';
import SubCategory from '../db/models/SubCategory';
import Image from '../db/models/image';
import Category from '../db/models/Category';
import redisClient from '../../src/redis/redis'

const SubCategoryRouter = express.Router();

// Create SubCategory
SubCategoryRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { category_id, name, description, image_id } = req.body;

    // Validate that the category_id exists in the Category table
    const categoryExists = await Category.findByPk(category_id);
    if (!categoryExists) {
      return res.status(400).json({ error: 'Category ID does not exist' });
    }

    // Validate that the image_id exists in the Image table if provided
    if (image_id) {
      const imageExists = await Image.findByPk(image_id);
      if (!imageExists) {
        return res.status(400).json({ error: 'Image ID does not exist' });
      }
    }

    const newSubCategory = await SubCategory.create({ category_id, name, description, image_id });
    res.status(201).send(newSubCategory);
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
});

// Get all SubCategories
SubCategoryRouter.get('/', async (req: Request, res: Response) => {
  const { category_id } = req.query;
  const cacheKey = category_id ? `subCategories:${category_id}` : 'subCategories'; // Define a cache key based on category_id if provided

  try {
    // Check if the subcategories data is already in Redis
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

      // Fetch the subcategories data from the database
      const subCategories = await SubCategory.findAll({
        include: [
          { model: Category, as: 'category' },
          { model: Image, as: 'image' }
        ],
        where: category_id ? { '$category.category_id$': category_id } : undefined, // Apply filter if category_id is provided
      });

      // Store the subcategories data in Redis with an expiration time of 2 seconds
      await redisClient.set(cacheKey, JSON.stringify(subCategories));
      await redisClient.expire(cacheKey, 2);

      // Respond with the subcategories data
      res.status(200).json(subCategories);
    });
  } catch (error: any) {
    console.error('Error in fetching subcategories:', error);
    res.status(500).json({ error: `Internal Server Error: ${error.message}` });
  }
});


// Get SubCategory by ID
SubCategoryRouter.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const cacheKey = `subCategory:${id}`; // Define a cache key based on the subcategory ID

  try {
    // Check if the subcategory data is already in Redis
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

      // Fetch the subcategory data from the database
      const subCategory = await SubCategory.findByPk(id, {
        include: [
          { model: Category, as: 'category' },
          { model: Image, as: 'image' }
        ]
      });

      if (!subCategory) {
        return res.status(404).send({ message: 'SubCategory not found' });
      }

      // Store the subcategory data in Redis with an expiration time of 2 seconds
      await redisClient.set(cacheKey, JSON.stringify(subCategory));
      await redisClient.expire(cacheKey, 2);

      // Respond with the subcategory data
      res.status(200).json(subCategory);
    });
  } catch (error: any) {
    console.error('Error in fetching subcategory by ID:', error);
    res.status(500).json({ error: `Internal Server Error: ${error.message}` });
  }
});


export default SubCategoryRouter;
