import express, { Request, Response } from 'express';
import Promotion from '../db/models/promotions'; // Adjust import based on your file structure
import redisClient from '../../src/redis/redis'

const PromotionRouter = express.Router();

// Route to create a new promotion
PromotionRouter.post('/create', async (req: Request, res: Response) => {
  try {
    const {
      promotion_name,
      description,
      promotion_type,
      start_date,
      end_date,
      discount_amount,
      discount_percentage,
      eligibility_criteria,
      usage_limit,
      promotion_code,
      associated_campaign
    } = req.body;

    // Validate required fields
    if (!promotion_name || !promotion_type || !start_date || !end_date || !promotion_code) {
      return res.status(400).send({ message: 'Please fill in all required fields.' });
    }

    // Create new promotion
    const newPromotion = await Promotion.create({
      promotion_name,
      description,
      promotion_type,
      start_date,
      end_date,
      discount_amount,
      discount_percentage,
      eligibility_criteria,
      usage_limit,
      promotion_code,
      associated_campaign
    });

    return res.status(201).send({ message: 'Promotion created successfully', promotion: newPromotion });
  } catch (error: any) {
    console.error('Error creating promotion:', error);
    return res.status(500).send({ message: `Error creating promotion: ${error.message}` });
  }
});

// Route to update an existing promotion
PromotionRouter.patch('/update/:promotion_id', async (req: Request, res: Response) => {
  try {
    const { promotion_id } = req.params;
    const {
      promotion_name,
      description,
      promotion_type,
      start_date,
      end_date,
      discount_amount,
      discount_percentage,
      eligibility_criteria,
      usage_limit,
      promotion_code,
      associated_campaign
    } = req.body;

    // Find promotion by ID
    const promotion = await Promotion.findByPk(promotion_id);
    if (!promotion) {
      return res.status(404).send({ message: 'Promotion not found.' });
    }

    // Update promotion details
    await promotion.update({
      promotion_name,
      description,
      promotion_type,
      start_date,
      end_date,
      discount_amount,
      discount_percentage,
      eligibility_criteria,
      usage_limit,
      promotion_code,
      associated_campaign
    });

    return res.status(200).send({ message: 'Promotion updated successfully', promotion });
  } catch (error: any) {
    console.error('Error updating promotion:', error);
    return res.status(500).send({ message: `Error updating promotion: ${error.message}` });
  }
});

// Route to retrieve a promotion by ID
PromotionRouter.get('/details/:promotion_id', async (req: Request, res: Response) => {
  const { promotion_id } = req.params;
  const cacheKey = `promotion:${promotion_id}`;

  try {
    // Check if the promotion data is already in Redis
    redisClient.get(cacheKey, async (err, cachedData) => {
      if (err) {
        console.error('Redis error:', err);
        return res.status(500).send({ message: 'Internal server error' });
      }

      if (cachedData) {
        // If data is found in Redis, parse and return it
        console.log('Cache hit, returning data from Redis');
        return res.status(200).send(JSON.parse(cachedData));
      }

      // Fetch the promotion data from the database
      const promotion = await Promotion.findByPk(promotion_id);
      if (!promotion) {
        return res.status(404).send({ message: 'Promotion not found.' });
      }

      // Store the promotion data in Redis with an expiration time of 2 seconds
      await redisClient.set(cacheKey, JSON.stringify(promotion));
      await redisClient.expire(cacheKey, 2);

      // Respond with the promotion data
      res.status(200).send({ promotion });
    });
  } catch (error: any) {
    console.error('Error retrieving promotion details:', error);
    res.status(500).send({ message: `Error retrieving promotion details: ${error.message}` });
  }
});


// Route to delete a promotion by ID
PromotionRouter.delete('/delete/:promotion_id', async (req: Request, res: Response) => {
  try {
    const { promotion_id } = req.params;

    // Find and delete promotion by ID
    const result = await Promotion.destroy({ where: { promotion_id } });
    if (result === 0) {
      return res.status(404).send({ message: 'Promotion not found.' });
    }

    return res.status(200).send({ message: 'Promotion deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting promotion:', error);
    return res.status(500).send({ message: `Error deleting promotion: ${error.message}` });
  }
});

export default PromotionRouter;
