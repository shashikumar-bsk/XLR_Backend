import express, { Request, Response } from 'express';
import Category from '../db/models/Category';
import Image from '../db/models/image';
import SuperCategory from '../db/models/SuperCategory';

const CategoryRouter = express.Router();

// Create Category
CategoryRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { super_category_id, name, description, image_id } = req.body;

    if (super_category_id) {
      const superCategoryExists = await SuperCategory.findByPk(super_category_id);
      if (!superCategoryExists) {
          return res.status(400).json({ error: 'Super Category ID does not exist' });
      }
  }

    // Validate that the image_id exists in the Image table if provided
    if (image_id) {
      const imageExists = await Image.findByPk(image_id);
      if (!imageExists) {
          return res.status(400).json({ error: 'Image ID does not exist' });
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
    const categories = await Category.findAll();
    res.status(200).send(categories);
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
});

// Get Category by ID
CategoryRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).send({ message: 'Category not found' });
    }
    res.status(200).send(category);
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
});

export default CategoryRouter;
