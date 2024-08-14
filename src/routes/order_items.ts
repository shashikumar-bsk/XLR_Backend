import express, { Request, Response } from 'express';
import Order from '../db/models/order';
import OrderItem from '../db/models/order_items';
import AddToCart from '../db/models/add_to_cart';// Updated import
import sequelizeConnection from '../db/config';
const OrderItemRouter = express.Router();

// Create OrderItem
OrderItemRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { order_id, cart_id } = req.body;

    // Validate if Order and AddToCart exist
    const order = await Order.findByPk(order_id);
    const cart = await AddToCart.findByPk(cart_id); // Updated reference
    if (!order || !cart) {
      return res.status(400).send({ message: 'Invalid order_id or cart_id' });
    }

    const newOrderItem = await OrderItem.create({ order_id, cart_id, is_deleted: false });
    res.status(201).send(newOrderItem);
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
});

// Get all OrderItems
OrderItemRouter.get('/', async (req: Request, res: Response) => {
  try {
    const orderItems = await OrderItem.findAll({
      where: { is_deleted: false },
      include: [
        { model: Order, as: 'order' },
        { model: AddToCart, as: 'cart' } // Updated reference
      ]
    });
    res.status(200).send(orderItems);
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
});

// Get OrderItem by ID
OrderItemRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const orderItem = await OrderItem.findByPk(id, {
      //where: { is_deleted: false },
      include: [
        { model: Order, as: 'order' },
        { model: AddToCart, as: 'cart' } // Updated reference
      ]
    });
    if (!orderItem) {
      return res.status(404).send({ message: 'OrderItem not found' });
    }
    res.status(200).send(orderItem);
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
});

// Update OrderItem by ID
OrderItemRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { order_id, cart_id, is_deleted } = req.body;

    // Validate if Order and AddToCart exist
    if (order_id) {
      const order = await Order.findByPk(order_id);
      if (!order) {
        return res.status(400).send({ message: 'Invalid order_id' });
      }
    }

    if (cart_id) {
      const cart = await AddToCart.findByPk(cart_id); // Updated reference
      if (!cart) {
        return res.status(400).send({ message: 'Invalid cart_id' });
      }
    }

    const orderItem = await OrderItem.findByPk(id);
    if (!orderItem) {
      return res.status(404).send({ message: 'OrderItem not found' });
    }

    // Update the order item with the new values
    await orderItem.update({ order_id, cart_id, is_deleted });

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


// Route to move items from AddToCart to OrderItems and mark AddToCart items as deleted
OrderItemRouter.post('/checkout', async (req: Request, res: Response) => {
  const { user_id, total_price } = req.body; // Assuming the user ID and total price are passed in the request body

  // Start a transaction
  const transaction = await sequelizeConnection.transaction();

  try {
      // Step 1: Find all cart items for the user
      const cartItems = await AddToCart.findAll({ where: { user_id, is_deleted: false }, transaction });

      if (cartItems.length === 0) {
          return res.status(404).json({ message: 'No items in the cart to checkout.' });
      }

      // Step 2: Create a new order
      const newOrder = await Order.create({ user_id, total_price, order_status: 'pending' }, { transaction });

      // Step 3: Move cart items to order items
      const orderItems = cartItems.map(item => ({
          order_id: newOrder.order_id,
          cart_id: item.cart_id,
          is_deleted: false
      }));

      await OrderItem.bulkCreate(orderItems, { transaction });

      // Step 4: Mark cart items as deleted
      await AddToCart.update({ is_deleted: true }, { where: { user_id, is_deleted: false }, transaction });

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
