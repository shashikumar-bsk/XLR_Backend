import express, { Request, Response } from 'express';
import InstamartOrder from '../db/models/instamartOrder';
import AddToCart from '../db/models/add_to_cart';
import instamartOrderItem from '../db/models/instamartOrderItems';
import sequelizeConnection from '../db/config';

const InstamartOrderItemRouter = express.Router();

// Create instamartOrderItem
InstamartOrderItemRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { Instamartorder_id,quantity, price } = req.body;

    // Validate if InstamartOrder and AddToCart exist
    const order = await InstamartOrder.findByPk(Instamartorder_id);

    if (!order) {
      return res.status(400).send({ message: 'Invalid Instamartorder_id or cart_id' });
    }

    const newOrderItem = await instamartOrderItem.create({
      Instamartorder_id,
      
      quantity,
      price,
      is_deleted: false
    });
    res.status(201).send(newOrderItem);
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
});

// Get all instamartOrderItems
InstamartOrderItemRouter.get('/', async (req: Request, res: Response) => {
  try {
    const orderItems = await instamartOrderItem.findAll({
      where: { is_deleted: false },
      include: [
        { model: InstamartOrder, as: 'order' },
      ]
    });
    res.status(200).send(orderItems);
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
});

// Get instamartOrderItem by ID
InstamartOrderItemRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const orderItem = await instamartOrderItem.findByPk(id, {
      include: [
        { model: InstamartOrder, as: 'order' },
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

// Update instamartOrderItem by ID
InstamartOrderItemRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { Instamartorder_id, quantity, price, is_deleted } = req.body;

    // Validate if InstamartOrder and AddToCart exist
    if (Instamartorder_id) {
      const order = await InstamartOrder.findByPk(Instamartorder_id);
      if (!order) {
        return res.status(400).send({ message: 'Invalid Instamartorder_id' });
      }
    }

    if (Instamartorder_id) {
      const cartItem = await InstamartOrder.findByPk(Instamartorder_id);
      if (!cartItem) {
        return res.status(400).send({ message: 'Invalid cart_id' });
      }
    }

    const orderItem = await instamartOrderItem.findByPk(id);
    if (!orderItem) {
      return res.status(404).send({ message: 'OrderItem not found' });
    }

    // Update the order item with the new values
    await orderItem.update({ Instamartorder_id, quantity, price, is_deleted });

    res.status(200).send(orderItem);
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
});

// Soft delete instamartOrderItem by ID
InstamartOrderItemRouter.patch('/:id/delete', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const orderItem = await instamartOrderItem.findByPk(id);

    if (!orderItem) {
      return res.status(404).send({ message: 'OrderItem not found' });
    }

    await orderItem.update({ is_deleted: true, deleted_at: new Date() });
    res.status(200).send({ message: 'OrderItem soft deleted' });
  } catch (error: any) {
    res.status(500).send({ message: error.message });
  }
});

// Route to move items from AddToCart to instamartOrderItems and mark AddToCart items as deleted
InstamartOrderItemRouter.post('/checkout', async (req: Request, res: Response) => {
  const { user_id, total_price, cart_id,quantity, address_id, payment_method } = req.body;

  // Validate required fields
  if (!user_id || !total_price ||!quantity || !address_id || !payment_method) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // Start a transaction
  const transaction = await sequelizeConnection.transaction();

  try {
    // Step 1: Find all cart items for the user
    const cartItems = await AddToCart.findAll({
      where: { user_id, is_deleted: false },
      transaction,
    });

    if (cartItems.length === 0) {
      return res.status(404).json({ message: 'No items in the cart to checkout.' });
    }

    // Step 2: Create a new order
    const newOrder = await InstamartOrder.create({
      user_id,
      total_price,
      quantity,
      address_id,
      payment_method,
      Instamartorder_status: 'pending'
    }, { transaction });

    // Step 3: Move cart items to order items
    const orderItems = cartItems.map(item => ({
      Instamartorder_id: newOrder.Instamartorder_id,
      cart_id: item.cart_id,
      quantity: item.quantity,
      price: item.price, // Ensure price is always a number
      is_deleted: false
    }));

    await instamartOrderItem.bulkCreate(orderItems, { transaction });

    // Step 4: Mark cart items as deleted
    await AddToCart.update(
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

export default InstamartOrderItemRouter;
