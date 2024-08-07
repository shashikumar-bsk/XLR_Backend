import express, { Request, Response } from 'express';
import SubCategory from '../db/models/SubCategory';
import Image from '../db/models/image';

const SubCategoryRouter = express.Router();

// Create SubCategory
SubCategoryRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { category_id, name, description, image_id } = req.body;
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
  try {
    const subCategories = await SubCategory.findAll();
    res.status(200).send(subCategories);
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
});

// Get SubCategory by ID
SubCategoryRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const subCategory = await SubCategory.findByPk(id);
    if (!subCategory) {
      return res.status(404).send({ message: 'SubCategory not found' });
    }
    res.status(200).send(subCategory);
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
});

export default SubCategoryRouter;
