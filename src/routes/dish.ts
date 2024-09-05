import express, { Request, Response } from 'express';
import Dish from '../db/models/dish'; // Adjust the path to your Dish model
import Image from '../db/models/image'; // Adjust the path to your Image model

const dishRouter = express.Router();

// Create a new dish
dishRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { restaurant_id, name, description, price, image_id } = req.body;

    // Basic validation
    if (!restaurant_id || !name || !price || !image_id) {
      return res.status(400).json({ success: false, error: 'Required fields are missing' });
    }

    const newDish = await Dish.create({
      restaurant_id,
      name,
      description,
      price,
      image_id
    });

    res.status(201).json({ success: true, data: transformDishOutput(newDish) });
  } catch (err) {
    console.error('Error in /dishes:', err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// Get dish by ID
dishRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const dish = await Dish.findByPk(id, { include: [{ model: Image, as: 'image' }] });


    if (!dish) {
      return res.status(404).send({ message: 'Dish not found.' });
    }

    return res.status(200).send(transformDishOutput(dish));
  } catch (error: any) {
    console.error('Error in fetching dish by ID:', error);
    return res.status(500).send({ message: `Error in fetching dish: ${error.message}` });
  }
});

// Get all dishes
dishRouter.get('/', async (req: Request, res: Response) => {
  try {
    const dishes = await Dish.findAll({ include: [Image] });

    return res.status(200).send(dishes.map(transformDishOutput));
  } catch (error: any) {
    console.error('Error in fetching dishes:', error);
    return res.status(500).send({ message: `Error in fetching dishes: ${error.message}` });
  }
});
// Get all dishes by restaurant_id
dishRouter.get('/restaurant/:restaurant_id', async (req: Request, res: Response) => {
  try {
    const { restaurant_id } = req.params;

    const dishes = await Dish.findAll({
      where: { restaurant_id },
      include: [{ model: Image, as: 'image' }],
    });

    if (dishes.length === 0) {
      return res.status(404).send({ message: 'No dishes found for this restaurant.' });
    }

    return res.status(200).send(dishes.map(transformDishOutput));
  } catch (error: any) {
    console.error('Error in fetching dishes by restaurant ID:', error);
    return res.status(500).send({ message: `Error in fetching dishes: ${error.message}` });
  }
});

// Update dish
dishRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { restaurant_id, name, description, price, image_id } = req.body;

    const [updated] = await Dish.update(
      { restaurant_id, name, description, price, image_id },
      { where: { id } }
    );

    if (updated) {
      const updatedDish = await Dish.findByPk(id, { include: [Image] });
      return res.status(200).send(transformDishOutput(updatedDish));
    } else {
      return res.status(404).send({ message: 'Dish not found.' });
    }
  } catch (error: any) {
    console.error('Error in updating dish:', error);
    return res.status(500).send({ message: `Error in updating dish: ${error.message}` });
  }
});

// Delete dish
dishRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const dish = await Dish.findByPk(id);
    if (!dish) {
      return res.status(404).send({ message: 'Dish not found.' });
    }

    // Hard delete dish
    await Dish.destroy({ where: { id } });

    return res.status(200).send({ message: 'Dish deleted successfully' });
  } catch (error: any) {
    console.error('Error in deleting dish:', error);
    return res.status(500).send({ message: `Error in deleting dish: ${error.message}` });
  }
});

// Helper function to transform the dish output
// function transformDishOutput(dish: any) {
//   if (!dish) return null;
//   const { id, restaurant_id, name, description, price, image_id, createdAt, updatedAt } = dish;
//   return {
//     id,
//     restaurant_id,
//     name,
//     description,
//     price,
//     image_id,
//     createdAt,
//     updatedAt,
//     Image: image_id.toString() // Transform the Image field to just image_id as a string
//   };
// }
function transformDishOutput(dish: any) {
  // console.log(dish); // Log the entire dish object
  if (!dish) return null;
  const { id, restaurant_id, name, description, price, createdAt, updatedAt, image } = dish;

  return {
    id,
    restaurant_id,
    name,
    description,
    price,
    createdAt,
    updatedAt,
    imageUrl: image ? image.image_url : null,
  };
}


export default dishRouter;
