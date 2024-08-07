import express, { Request, Response } from 'express';
import SuperCategory from '../db/models/SuperCategory';

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
  try {
    const superCategories = await SuperCategory.findAll();
    res.status(200).send(superCategories);
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
});

// Get SuperCategory by ID
SuperCategoryRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const superCategory = await SuperCategory.findByPk(id);
    if (!superCategory) {
      return res.status(404).send({ message: 'SuperCategory not found' });
    }
    res.status(200).send(superCategory);
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
});

export default SuperCategoryRouter;
