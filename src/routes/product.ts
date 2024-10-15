import express, { Request, Response, NextFunction } from 'express';
import Product from '../db/models/product'; // Adjust the path to your Product model
import SubCategory from '../db/models/SubCategory';
import Brand from '../db/models/brand';
import Image from '../db/models/image';
import redisClient from '../../src/redis/redis';

const productRouter = express.Router();

// Create a new product
productRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { sub_category_id, brand_id, image_id, name, description, quantity, total_quantity, price, discount_price, is_available, warehouse_location } = req.body;
        
        // Validate SubCategory ID
        if (sub_category_id) {
            const subCategoryExists = await SubCategory.findByPk(sub_category_id);
            if (!subCategoryExists) {
                return res.status(400).json({ error: 'SubCategory ID does not exist' });
            }
        }

        // Validate Brand ID
        if (brand_id) {
            const brandExists = await Brand.findByPk(brand_id);
            if (!brandExists) {
                return res.status(400).json({ error: 'Brand ID does not exist' });
            }
        }

        // Validate Image ID
        if (image_id) {
            const imageExists = await Image.findByPk(image_id);
            if (!imageExists) {
                return res.status(400).json({ error: 'Image ID does not exist' });
            }
        }

        // Create new product
        const newProduct = await Product.create({
            sub_category_id,
            brand_id,
            image_id,
            name,
            description,
            quantity,
            total_quantity, // Include total_quantity
            price,
            discount_price,
            is_available,
            warehouse_location // Include warehouse_location
        });

        res.status(201).json(newProduct);
    } catch (error) {
        next(error);
    }
});

// Get all products with optional category filter
productRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
    const { sub_category_id } = req.query;
    const cacheKey = `products:${sub_category_id || 'all'}`;
  
    try {
      // Check if the products data is already in Redis
      redisClient.get(cacheKey, async (err, cachedData) => {
        if (err) {
          console.error('Redis error:', err);
          return next(err);
        }
  
        if (cachedData) {
          console.log('Cache hit, returning data from Redis');
          return res.json(JSON.parse(cachedData));
        }
  
        // Fetch the products data from the database
        const products = await Product.findAll({
          include: [
            { model: SubCategory, as: 'subCategory' },
            { model: Brand, as: 'brand' },
            { model: Image, as: 'image' }
          ],
          where: sub_category_id ? { '$subCategory.sub_category_id$': sub_category_id } : undefined
        });
  
        await redisClient.set(cacheKey, JSON.stringify(products));
        await redisClient.expire(cacheKey, 2);
  
        res.status(200).json(products);
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      next(error);
    }
});

// Get a product by ID
productRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const cacheKey = `product:${id}`;
  
    try {
      redisClient.get(cacheKey, async (err, cachedData) => {
        if (err) {
          console.error('Redis error:', err);
          return next(err);
        }
  
        if (cachedData) {
          console.log('Cache hit, returning data from Redis');
          return res.json(JSON.parse(cachedData));
        }
  
        const product = await Product.findByPk(id, {
          include: [
            { model: SubCategory, as: 'subCategory' },
            { model: Brand, as: 'brand' },
            { model: Image, as: 'image' }
          ]
        });
  
        if (!product) {
          return res.status(404).json({ message: 'Product not found' });
        }
  
        await redisClient.set(cacheKey, JSON.stringify(product));
        await redisClient.expire(cacheKey, 2);
  
        res.status(200).json(product);
      });
    } catch (error) {
      console.error('Error fetching product:', error);
      next(error);
    }
});

// Update a product by ID
productRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { sub_category_id, brand_id, image_id, name, description, quantity, total_quantity, price, discount_price, is_available, warehouse_location } = req.body;

        // Validate existence of related entities
        if (sub_category_id) {
            const subCategoryExists = await SubCategory.findByPk(sub_category_id);
            if (!subCategoryExists) {
                return res.status(400).json({ error: 'SubCategory ID does not exist' });
            }
        }
        if (brand_id) {
            const brandExists = await Brand.findByPk(brand_id);
            if (!brandExists) {
                return res.status(400).json({ error: 'Brand ID does not exist' });
            }
        }
        if (image_id) {
            const imageExists = await Image.findByPk(image_id);
            if (!imageExists) {
                return res.status(400).json({ error: 'Image ID does not exist' });
            }
        }

        const [updated] = await Product.update({
            sub_category_id,
            brand_id,
            image_id,
            name,
            description,
            quantity,
            total_quantity, // Include total_quantity
            price,
            discount_price,
            is_available,
            warehouse_location // Include warehouse_location
        }, {
            where: { product_id: id }
        });

        if (updated) {
            const updatedProduct = await Product.findByPk(id);
            res.status(200).json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        next(error);
    }
});

// Delete a product by ID
productRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        await product.destroy();

        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        next(error);
    }
});

export default productRouter;
