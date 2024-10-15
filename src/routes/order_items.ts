import express, { Request, Response } from 'express';
import Order from '../db/models/order';
import OrderItem from '../db/models/order_items';
import Dish from '../db/models/dish';
import CartItemRest from '../db/models/CartItemRestaurants';
import sequelizeConnection from '../db/config';
import redisClient from '../../src/redis/redis'

const OrderItemRouter = express.Router();

// Create OrderItem
OrderItemRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { order_id, dish_id, quantity, price } = req.body;

    // Validate if Order and Dish exist
    const order = await Order.findByPk(order_id);
    const dish = await Dish.findByPk(dish_id);
    if (!order || !dish) {
      return res.status(400).send({ message: 'Invalid order_id or dish_id' });
    }

    const newOrderItem = await OrderItem.create({
      order_id,
      dish_id,
      quantity,
      price,
      is_deleted: false
    });
    res.status(201).send(newOrderItem);
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
});

// Get all OrderItems
OrderItemRouter.get('/', async (req: Request, res: Response) => {
  const cacheKey = 'orderItems:all';

  try {
    // Check if the order items data is already in Redis
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

      // Fetch the order items data from the database
      const orderItems = await OrderItem.findAll({
        where: { is_deleted: false },
        include: [
          { model: Order, as: 'order' },
          { model: Dish, as: 'dish' }
        ]
      });

      // Store the order items data in Redis with an expiration time of 2 seconds
      await redisClient.set(cacheKey, JSON.stringify(orderItems));
      await redisClient.expire(cacheKey, 2);

      // Respond with the order items data
      res.status(200).json(orderItems);
    });
  } catch (error: any) {
    console.error('Error fetching order items:', error);
    res.status(500).json({ message: error.message });
  }
});


// Get OrderItem by ID

OrderItemRouter.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const cacheKey = `orderItem:${id}`;

  try {
    // Check if the order item data is already in Redis
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

      // Fetch the order item data from the database
      const orderItem = await OrderItem.findByPk(id, {
        include: [
          { model: Order, as: 'order' },
          { model: Dish, as: 'dish' }
        ]
      });

      if (!orderItem) {
        return res.status(404).send({ message: 'OrderItem not found' });
      }

      // Store the order item data in Redis with an expiration time of 2 seconds
      await redisClient.set(cacheKey, JSON.stringify(orderItem));
      await redisClient.expire(cacheKey, 2);

      // Respond with the order item data
      res.status(200).json(orderItem);
    });
  } catch (error: any) {
    console.error('Error fetching order item by ID:', error);
    res.status(500).send({ message: error.message });
  }
});


// Update OrderItem by ID
OrderItemRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { order_id, dish_id, quantity, price, is_deleted } = req.body;

    // Validate if Order and Dish exist
    if (order_id) {
      const order = await Order.findByPk(order_id);
      if (!order) {
        return res.status(400).send({ message: 'Invalid order_id' });
      }
    }

    if (dish_id) {
      const dish = await Dish.findByPk(dish_id);
      if (!dish) {
        return res.status(400).send({ message: 'Invalid dish_id' });
      }
    }

    const orderItem = await OrderItem.findByPk(id);
    if (!orderItem) {
      return res.status(404).send({ message: 'OrderItem not found' });
    }

    // Update the order item with the new values
    await orderItem.update({ order_id, dish_id, quantity, price, is_deleted });

    res.status(200).send(orderItem);
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
});

// Soft delete OrderItem by ID
OrderItemRouter.patch('/:id/delete', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const orderItem = await OrderItem.findByPk(id);

    if (!orderItem) {
      return res.status(404).send({ message: 'OrderItem not found' });
    }

    await orderItem.update({ is_deleted: true, deleted_at: new Date() });
    res.status(200).send({ message: 'OrderItem soft deleted' });
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
});

// Route to move items from CartItemRest to OrderItems and mark CartItemRest items as deleted
OrderItemRouter.post('/checkout', async (req: Request, res: Response) => {
  const { user_id, total_price, restaurant_id, address_id, payment_method } = req.body;

  // Validate required fields
  if (!user_id || !total_price || !restaurant_id || !address_id || !payment_method) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // Start a transaction
  const transaction = await sequelizeConnection.transaction();

  try {
    // Step 1: Find all cart items for the user
    const cartItems = await CartItemRest.findAll({
      where: { user_id, is_deleted: false },
      transaction,
    });

    if (cartItems.length === 0) {
      return res.status(404).json({ message: 'No items in the cart to checkout.' });
    }

    // Step 2: Create a new order
    const newOrder = await Order.create({
      user_id,
      total_price,
      restaurant_id,
      address_id,
      payment_method,
      order_status: 'pending'
    }, { transaction });

    // Step 3: Move cart items to order items
    const orderItems = cartItems.map(item => ({
      order_id: newOrder.order_id,
      dish_id: item.dish_id,
      quantity: item.quantity,
      price: item.totalPrice || 0, // Ensure price is always a number
      is_deleted: false
    }));

    await OrderItem.bulkCreate(orderItems, { transaction });

    // Step 4: Mark cart items as deleted
    await CartItemRest.update(
      { is_deleted: true },
      { where: { user_id, is_deleted: false }, transaction }
    );

    // Commit the transaction
    await transaction.commit();

    res.status(200).json({ message: 'Checkout successful. Cart items moved to order items and cart emptied.' });
  } catch (error) {
    // Rollback the transaction in case of an error
    await transaction.rollback();
    console.error(error);
    res.status(500).json({ message: 'An error occurred during checkout.' });
  }
});

export default OrderItemRouter;