import express, { Request, Response } from 'express';
import Category from '../db/models/Category';
import SuperCategory from '../db/models/SuperCategory';
import Image from '../db/models/image';

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
    const categories = await Category.findAll({
      include: [
        { model: SuperCategory, as: 'superCategory' },
        { model: Image, as: 'image' }
      ]
    });
    res.status(200).send(categories);
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
});

// Get Category by ID
CategoryRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id, {
      include: [
        { model: SuperCategory, as: 'superCategory' },
        { model: Image, as: 'image' }
      ]
    });
    if (!category) {
      return res.status(404).send({ message: 'Category not found' });
    }
    res.status(200).send(category);
  } catch (error: any) {
    console.error('Error fetching category:', error);
    res.status(500).send({ message: error.message });
  }
});

export default CategoryRouter;
