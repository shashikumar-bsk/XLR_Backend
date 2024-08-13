import express, { Request, Response } from 'express';
import Order from '../db/models/order'; // Adjust the path as necessary

const orderRouter = express.Router();

// Create a new order
orderRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { user_id, total_price,  order_status } = req.body;

    if (!user_id || !total_price || !order_status) {
      return res.status(400).json({ message: 'Missing required fields: user_id, total_price, order_status' });
    }

    const newOrder = await Order.create({
      user_id,
      total_price,
    //   tax_amount,
    //   discount_amount,
    //   final_price,
      order_status
    });

    res.status(201).json(newOrder);
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
});

// Get all orders
orderRouter.get('/', async (req: Request, res: Response) => {
  try {
    const orders = await Order.findAll();
    res.status(200).json(orders);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
});

// Get a single order by ID
orderRouter.get('/:order_id', async (req: Request, res: Response) => {
  try {
    const { order_id } = req.params;

    const order = await Order.findByPk(order_id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json(order);
  } catch (error: any) {
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
    //   tax_amount,
    //   discount_amount,
    //   final_price,
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


export default orderRouter;
