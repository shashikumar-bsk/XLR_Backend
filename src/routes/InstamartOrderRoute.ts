import express, { Request, Response } from 'express';
import InstamartOrder from '../db/models/instamartOrder';
import { User } from '../db/models';
import Address from '../db/models/Address'; // Adjust the path as necessary
import AddToCart from '../db/models/add_to_cart';
import instamartOrderItem from '../db/models/instamartOrderItems';

const instamartOrderRouter = express.Router();

// Create a new InstamartOrder
instamartOrderRouter.post('/create', async (req: Request, res: Response) => {
  try {
    const { user_id, total_price, Instamartorder_status, payment_method, address_id, quantity } = req.body;

    // Validate required fields
    if (!user_id || !total_price || !Instamartorder_status || !payment_method || !address_id ||  !quantity) {
      return res.status(400).json({ message: 'Missing required fields: user_id, total_price, Instamartorder_status, payment_method, address_id, cart_id, quantity' });
    }

    // Create the new InstamartOrder
    const newInstamartOrder = await InstamartOrder.create({
      user_id,
      address_id,
      total_price,
      Instamartorder_status,
      payment_method,
      quantity,
    });

    
      await instamartOrderItem.create({
        Instamartorder_id: newInstamartOrder.Instamartorder_id,
        quantity: newInstamartOrder.quantity,
        price: newInstamartOrder.total_price,
        is_deleted: false, // Add the is_deleted field with a default value
      });
    

     // Clear the user's cart after the order is placed
     await AddToCart.destroy({ where: { user_id } });

    // Respond with success
    res.status(201).json({ success: true, Instamartorder_id: newInstamartOrder.Instamartorder_id });
  } catch (error: any) {
    // Handle errors
    res.status(500).json({ success: false, message: 'Error creating order', error: error.message });
  }
});


// Get all InstamartOrders
instamartOrderRouter.get('/', async (req: Request, res: Response) => {
  try {
    const orders = await InstamartOrder.findAll({
      include: [User, Address, AddToCart] // Include related data
    });
    res.status(200).json(orders);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
});

// Get a single InstamartOrder by ID
instamartOrderRouter.get('/:Instamartorder_id', async (req: Request, res: Response) => {
  try {
    const { Instamartorder_id } = req.params;

    const order = await InstamartOrder.findByPk(Instamartorder_id, {
      include: [User, Address, AddToCart] // Include related data
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json(order);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
});

// Update an InstamartOrder by ID
instamartOrderRouter.patch('/:Instamartorder_id', async (req: Request, res: Response) => {
  try {
    const { Instamartorder_id } = req.params;
    const { user_id, total_price, Instamartorder_status, payment_method, address_id, quantity } = req.body;

    const [updated] = await InstamartOrder.update({
      user_id,
      total_price,
      Instamartorder_status,
      payment_method,
      address_id,
      quantity,
    }, {
      where: { Instamartorder_id },
    });

    if (updated) {
      const updatedOrder = await InstamartOrder.findByPk(Instamartorder_id);
      res.status(200).json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating order', error: error.message });
  }
});

// Delete an InstamartOrder by ID
instamartOrderRouter.delete('/:Instamartorder_id', async (req: Request, res: Response) => {
  try {
    const { Instamartorder_id } = req.params;

    const deleted = await InstamartOrder.destroy({
      where: { Instamartorder_id },
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

// Get InstamartOrder by ID and User ID
instamartOrderRouter.get('/:Instamartorder_id/:user_id', async (req: Request, res: Response) => {
  try {
    const { Instamartorder_id, user_id } = req.params;

    const order = await InstamartOrder.findOne({
      where: {
        Instamartorder_id,
        user_id,
      },
      include: [User, Address, AddToCart], // Include related data
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found for the given user' });
    }

    res.status(200).json(order);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching order', error: error.message });
  }
});

export default instamartOrderRouter;
