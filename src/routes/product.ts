//productRoute.ts
import express, { Request, Response, NextFunction } from 'express';
import Product from '../db/models/product'; // Adjust the path to your Product model
import SubCategory from '../db/models/SubCategory';
import Brand from '../db/models/brand';
import Image from '../db/models/image';
const productRouter = express.Router();

// Create a new product
productRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { sub_category_id, brand_id, image_id, name, description, price, discount_price, is_available } = req.body;
        if (sub_category_id) {
            const subCategoryExists = await Image.findByPk(sub_category_id);
            if (!subCategoryExists) {
                return res.status(400).json({ error: 'SubCategory ID does not exist' });
            }
        }
        if (brand_id) {
            const brandExists = await Image.findByPk(brand_id);
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
        const newProduct = await Product.create({
            sub_category_id,
            brand_id,
            image_id,
            name,
            description,
            price,
            discount_price,
            is_available
        });

        res.status(201).json(newProduct);
    } catch (error) {
        next(error);
    }
});

// Get all products
productRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const products = await Product.findAll();
        res.status(200).json(products);
    } catch (error) {
        next(error);
    }
});

// Get a product by ID
productRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id);

        if (product) {
            res.status(200).json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        next(error);
    }
});

// Update a product by ID
productRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { sub_category_id, brand_id, image_id, name, description, price, discount_price, is_available } = req.body;

        const [updated] = await Product.update({
            sub_category_id,
            brand_id,
            image_id,
            name,
            description,
            price,
            discount_price,
            is_available
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

        // Find the product by ID
        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Delete the product
        await product.destroy();

        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        next(error);
    }
});

export default productRouter;
