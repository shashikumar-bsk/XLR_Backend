import express, { Request, Response, NextFunction } from 'express';
import Image from '../db/models/image';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import Product from '../db/models/product';
import Category from '../db/models/Category';
import SubCategory from '../db/models/SubCategory';
import Brand from '../db/models/brand';
import Restaurant from '../db/models/restaurant';
import redisClient from '../../src/redis/redis'

dotenv.config();

const ImageRouter = express.Router();

// Ensure all environment variables are defined
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.BUCKET_REGION || !process.env.BUCKET_NAME) {
  throw new Error('Missing necessary AWS configuration in .env file');
}

// Configure AWS S3 using S3Client
const s3 = new S3Client({
  region: process.env.BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Configure multer to use S3
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.BUCKET_NAME as string,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      cb(null, `images/${Date.now()}_${file.originalname}`);
    },
  }),
});

  // Middleware to handle multer errors
  function multerErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, error: `Multer Error: ${err.message}` });
    }
    next(err);
  }

// Route to upload image
ImageRouter.post('/upload', upload.single('image'), async (req: Request, res: Response) => {
  console.log('Request Fields:', req.body);
  console.log('Request File:', req.file);

  try {
    const file = req.file as Express.MulterS3.File;
    const { entity_type, entity_id, alt_text } = req.body;

    if (!file || !entity_type || !entity_id) {
      return res.status(400).json({ success: false, error: 'All required fields are not provided' });
    }

     // Check if the entity exists based on entity_type
     if (entity_type === 'Category') {
      const categoryExists = await Category.findByPk(entity_id);
      if (!categoryExists) {
        return res.status(404).json({ success: false, error: 'Category not found' });
      }
    }

    if (entity_type === 'SubCategory') {
      const subCategoryExists = await SubCategory.findByPk(entity_id);
      if (!subCategoryExists) {
        return res.status(404).json({ success: false, error: 'SubCategory not found' });
      }
    }

    if (entity_type === 'product') {
      const productExists = await Product.findByPk(entity_id);
      if (!productExists) {
        return res.status(404).json({ success: false, error: 'Product not found' });
      }
    }

    if (entity_type === 'brand') {
      const brandExists = await Brand.findByPk(entity_id);
      if (!brandExists) {
        return res.status(404).json({ success: false, error: 'Brand not found' });
      }
    }

    if (entity_type === 'restaurant') {
      const restaurantExists = await Restaurant.findByPk(entity_id);
      if (!restaurantExists) {
        return res.status(404).json({ success: false, error: 'restaurant not found' });
      }
    }

    if (entity_type === 'dish') {
      const dishExists = await Brand.findByPk(entity_id);
      if (!dishExists) {
        return res.status(404).json({ success: false, error: 'dish not found' });
      }
    }

    if (entity_type === 'inventory') {
      const inventoryExists = await Brand.findByPk(entity_id);
      if (!inventoryExists) {
        return res.status(404).json({ success: false, error: 'inventory not found' });
      }
    }
    
    
    const image = await Image.create({
      entity_type,
      entity_id,
      image_url: file.location,
      alt_text: alt_text || '',
    });

    res.status(200).json({ success: true, data: image });
  } catch (err: any) {
    console.error('Error in /upload:', err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// Get an image by ID
ImageRouter.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const cacheKey = `image:${id}`;

  try {
    // Check if the image data is already in Redis
    redisClient.get(cacheKey, async (err, cachedData) => {
      if (err) {
        console.error('Redis error:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }

      if (cachedData) {
        // If data is found in Redis, parse and return it
        console.log('Cache hit, returning data from Redis');
        return res.json(JSON.parse(cachedData));
      }

      // Fetch the image data from the database
      const image = await Image.findOne({ where: { image_id: id } });

      if (!image) {
        return res.status(404).json({ message: 'Image not found' });
      }

      // Store the image data in Redis with an expiration time of 2 seconds
      await redisClient.set(cacheKey, JSON.stringify(image));
      await redisClient.expire(cacheKey, 2);

      // Respond with the image data
      res.status(200).json(image);
    });
  } catch (error: any) {
    console.error('Error in fetching image by ID:', error);
    res.status(500).json({ message: `Error in fetching image: ${error.message}` });
  }
});




// Get all images
ImageRouter.get('/', async (req: Request, res: Response) => {
  const cacheKey = 'all_images';

  try {
    // Check if the images data is already in Redis
    redisClient.get(cacheKey, async (err, cachedData) => {
      if (err) {
        console.error('Redis error:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }

      if (cachedData) {
        // If data is found in Redis, parse and return it
        console.log('Cache hit, returning data from Redis');
        return res.json(JSON.parse(cachedData));
      }

      // Fetch the images data from the database
      const images = await Image.findAll();

      // Store the images data in Redis with an expiration time of 2 seconds
      await redisClient.set(cacheKey, JSON.stringify(images));
      await redisClient.expire(cacheKey, 2);

      // Respond with the images data
      res.status(200).json(images);
    });
  } catch (error: any) {
    console.error('Error in fetching images:', error);
    res.status(500).json({ message: `Error in fetching images: ${error.message}` });
  }
});


// Update an image
ImageRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { image_url, alt_text } = req.body;

    const image = await Image.findOne({ where: { image_id: id } });
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    await image.update({ image_url, alt_text });

    res.status(200).json({ message: 'Image updated successfully', data: image });
  } catch (error: any) {
    console.error('Error in updating image:', error);
    res.status(500).json({ message: `Error in updating image: ${error.message}` });
  }
});

// Delete an image
ImageRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const image = await Image.findOne({ where: { image_id: id } });
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    await image.destroy();

    res.status(200).json({ message: 'Image deleted successfully' });
  } catch (error: any) {
    console.error('Error in deleting image:', error);
    res.status(500).json({ message: `Error in deleting image: ${error.message}` });
  }
});

export default ImageRouter;
