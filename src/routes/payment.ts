
import { Router, Request, Response } from 'express';
import Payment, { PaymentInput, PaymentOutput } from '../db/models/payment';
import { PaymentStatus } from '../db/models/payment';
import redisClient from '../../src/redis/redis'

const paymentrouter = Router();

// Create a new payment
paymentrouter.post('/', async (req: Request, res: Response) => {
    try {
        const { order_id, transaction_id, payment_status } = req.body;

        // Validate payment_status
        if (!Object.values(PaymentStatus).includes(payment_status)) {
            return res.status(400).json({ message: 'Invalid payment status' });
        }

        const paymentData: PaymentInput = {
            order_id,
            transaction_id,
            payment_status,
        };

        const newPayment: PaymentOutput = await Payment.create(paymentData);
        res.status(201).json(newPayment);
    } catch (error) {
        res.status(500).json({ message: 'Error creating payment', error });
    }
});

// Get all payments
paymentrouter.get('/', async (req: Request, res: Response) => {
    const cacheKey = 'payments:all';
  
    try {
      // Check if the payments data is already in Redis
      redisClient.get(cacheKey, async (err, cachedData) => {
        if (err) {
          console.error('Redis error:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
  
        if (cachedData) {
          // If data is found in Redis, parse and return it
          console.log('Cache hit, returning data from Redis');
          return res.json(JSON.parse(cachedData));
        }
  
        // Fetch the payments data from the database
        const payments: PaymentOutput[] = await Payment.findAll();
  
        // Store the payments data in Redis with an expiration time of 2 seconds
        await redisClient.set(cacheKey, JSON.stringify(payments));
        await redisClient.expire(cacheKey, 2);
  
        // Respond with the payments data
        res.status(200).json(payments);
      });
    } catch (error: any) {
      console.error('Error retrieving payments:', error);
      res.status(500).json({ message: 'Error retrieving payments', error: error.message });
    }
  });
  

// Get a payment by ID
paymentrouter.get('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const cacheKey = `payment:${id}`;
  
    try {
      // Check if the payment data is already in Redis
      redisClient.get(cacheKey, async (err, cachedData) => {
        if (err) {
          console.error('Redis error:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
  
        if (cachedData) {
          // If data is found in Redis, parse and return it
          console.log('Cache hit, returning data from Redis');
          return res.json(JSON.parse(cachedData));
        }
  
        // Fetch the payment data from the database
        const payment = await Payment.findByPk(id);
  
        if (payment) {
          // Store the payment data in Redis with an expiration time of 2 seconds
          await redisClient.set(cacheKey, JSON.stringify(payment));
          await redisClient.expire(cacheKey, 2);
  
          // Respond with the payment data
          res.status(200).json(payment);
        } else {
          res.status(404).json({ message: 'Payment not found' });
        }
      });
    } catch (error: any) {
      console.error('Error retrieving payment:', error);
      res.status(500).json({ message: 'Error retrieving payment', error: error.message });
    }
  });
  

// Update a payment
paymentrouter.put('/:id', async (req: Request, res: Response) => {
    try {
        const { order_id, transaction_id, payment_status } = req.body;
        const payment = await Payment.findByPk(req.params.id);

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        // Validate payment_status
        if (payment_status && !Object.values(PaymentStatus).includes(payment_status)) {
            return res.status(400).json({ message: 'Invalid payment status' });
        }

        payment.order_id = order_id !== undefined ? order_id : payment.order_id;
        payment.transaction_id = transaction_id !== undefined ? transaction_id : payment.transaction_id;
        payment.payment_status = payment_status !== undefined ? payment_status : payment.payment_status;

        await payment.save();
        res.status(200).json(payment);
    } catch (error) {
        res.status(500).json({ message: 'Error updating payment', error });
    }
});

// Delete a payment
paymentrouter.delete('/:id', async (req: Request, res: Response) => {
    try {
        const payment = await Payment.findByPk(req.params.id);

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        await payment.destroy();
        res.status(204).json({ message: 'Payment deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting payment', error });
    }
});

export default paymentrouter;
