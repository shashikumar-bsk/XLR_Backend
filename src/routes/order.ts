import express, { Request, Response } from 'express';
import Order from '../db/models/order'; // Adjust the path as necessary
import { User } from '../db/models';
import Cart from "../db/models/CartItemRestaurants"; // Adjust the path as necessary
import OrderItem from "../db/models/order_items"; // Adjust the path as necessary
import Dish from '../db/models/dish'; // Adjust the path as necessary
import redisClient from '../../src/redis/redis'

const orderRouter = express.Router();

// Create a new order
orderRouter.post('/create', async (req: Request, res: Response) => {
  try {
    const { user_id, total_price, order_status, restaurant_id, address_id, payment_method } = req.body;

    if (!user_id || !total_price || !order_status || !restaurant_id || !address_id || !payment_method) {
      return res.status(400).json({ message: 'Missing required fields: user_id, total_price, order_status, restaurant_id, address_id, payment_method' });
    }

    // Create the new order
    const newOrder = await Order.create({
      user_id,
      restaurant_id,
      address_id,
      total_price,
      order_status,
      payment_method
    });

    // Fetch items from the user's cart
    const cartItems = await Cart.findAll({ where: { user_id } });

    if (cartItems.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Iterate over the cart items and create OrderItem records
    for (const item of cartItems) {
      const dish = await Dish.findByPk(item.dish_id); // Fetch dish details for the order item

      if (!dish) {
        return res.status(404).json({ message: `Dish with ID ${item.dish_id} not found` });
      }

      await OrderItem.create({
        order_id: newOrder.order_id,  // Ensure you use the correct field name
        dish_id: item.dish_id,
        quantity: item.quantity,
        price: dish.price,
        is_deleted: false, // Add the is_deleted field with a default value
      });
    } 

    // Clear the user's cart after the order is placed
    await Cart.destroy({ where: { user_id } });

    res.status(201).json({ success: true, order_id: newOrder.order_id });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error creating order', error: error.message });
  }
});

// Get all orders
orderRouter.get('/', async (req: Request, res: Response) => {
  const cacheKey = 'orders';

  try {
    // Check if the orders data is already in Redis
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

      // Fetch the orders data from the database
      const orders = await Order.findAll({
        include: [User] // Include related User data
      });

      // Store the orders data in Redis with an expiration time of 2 seconds
      await redisClient.set(cacheKey, JSON.stringify(orders));
      await redisClient.expire(cacheKey, 2);

      // Respond with the orders data
      res.status(200).json(orders);
    });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
});


// Get a single order by ID
orderRouter.get('/:order_id', async (req: Request, res: Response) => {
  const { order_id } = req.params;
  const cacheKey = `order:${order_id}`;

  try {
    // Check if the order data is already in Redis
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

      // Fetch the order data from the database
      const order = await Order.findByPk(order_id, {
        include: [User] // Include related User data
      });

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Store the order data in Redis with an expiration time of 2 seconds
      await redisClient.set(cacheKey, JSON.stringify(order));
      await redisClient.expire(cacheKey, 2);

      // Respond with the order data
      res.status(200).json(order);
    });
  } catch (error: any) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
});


// Update an order by ID
orderRouter.patch('/:order_id', async (req: Request, res: Response) => {
  try {
    const { order_id } = req.params;
    const { user_id, total_price, order_status } = req.body;

    const [updated] = await Order.update({
      user_id,
      total_price,
      order_status
    }, {
      where: { order_id },
    });

    if (updated) {
      const updatedOrder = await Order.findByPk(order_id);
      res.status(200).json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating order', error: error.message });
  }
});

// Delete an order by ID
orderRouter.delete('/:order_id', async (req: Request, res: Response) => {
  try {
    const { order_id } = req.params;

    const deleted = await Order.destroy({
      where: { order_id },
    });

    if (deleted) {
      res.status(204).json({ message: 'Order deleted' });
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting order', error: error.message });
  }
});

// Get order by ID and User ID
orderRouter.get('/:order_id/:user_id', async (req: Request, res: Response) => {
  const { order_id, user_id } = req.params;
  const cacheKey = `order:${order_id}:user:${user_id}`;

  try {
    // Check if the order data is already in Redis
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

      // Fetch the order data from the database
      const order = await Order.findOne({
        where: {
          order_id,
          user_id,
        },
        include: [User], // Optionally include related User data
      });

      if (!order) {
        return res.status(404).json({ message: 'Order not found for the given user' });
      }

      // Store the order data in Redis with an expiration time of 2 seconds
      await redisClient.set(cacheKey, JSON.stringify(order));
      await redisClient.expire(cacheKey, 2);

      // Respond with the order data
      res.status(200).json(order);
    });
  } catch (error: any) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
});


export default orderRouter;
