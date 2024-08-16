// import express, { Request, Response } from 'express';
// import Payment from '../db/models/payment';// Adjust the import path as needed

// const paymentRouter = express.Router();

// // Create a new payment
// paymentRouter.post('/', async (req: Request, res: Response) => {
//     try {
//         const { order_id, transaction_id, payment_status } = req.body;

//         // Basic validation
//         if (!order_id || !transaction_id || !payment_status) {
//             return res.status(400).json({ error: 'Order ID, transaction ID, and payment status are required' });
//         }

//         const newPayment = await Payment.create({
//             order_id,
//             transaction_id,
//             payment_status,
//         });

//         res.status(201).json(newPayment);
//     } catch (error) {
//         res.status(500).json({ error: 'Failed to create payment', details: error });
//     }
// });

// // Get all payments
// paymentRouter.get('/', async (req: Request, res: Response) => {
//     try {
//         const payments = await Payment.findAll();
//         res.status(200).json(payments);
//     } catch (error) {
//         res.status(500).json({ error: 'Failed to fetch payments', details: error });
//     }
// });

// // Get a specific payment by ID
// paymentRouter.get('/:id', async (req: Request, res: Response) => {
//     try {
//         const payment = await Payment.findByPk(req.params.id);
//         if (payment) {
//             res.status(200).json(payment);
//         } else {
//             res.status(404).json({ error: 'Payment not found' });
//         }
//     } catch (error) {
//         res.status(500).json({ error: 'Failed to fetch payment', details: error });
//     }
// });

// // Update a payment by ID
// paymentRouter.put('/:id', async (req: Request, res: Response) => {
//     try {
//         const { order_id, transaction_id, payment_status } = req.body;

//         // Basic validation
//         if (!order_id || !transaction_id || !payment_status) {
//             return res.status(400).json({ error: 'Order ID, transaction ID, and payment status are required' });
//         }

//         const [updated] = await Payment.update({
//             order_id,
//             transaction_id,
//             payment_status,
//         }, {
//             where: { payment_id: req.params.id }
//         });

//         if (updated) {
//             const updatedPayment = await Payment.findByPk(req.params.id);
//             res.status(200).json(updatedPayment);
//         } else {
//             res.status(404).json({ error: 'Payment not found' });
//         }
//     } catch (error) {
//         res.status(500).json({ error: 'Failed to update payment', details: error });
//     }
// });

// // Delete a payment by ID
// paymentRouter.delete('/:id', async (req: Request, res: Response) => {
//     try {
//         const deleted = await Payment.destroy({
//             where: { payment_id: req.params.id }
//         });
//         if (deleted) {
//             res.status(204).send();
//         } else {
//             res.status(404).json({ error: 'Payment not found' });
//         }
//     } catch (error) {
//         res.status(500).json({ error: 'Failed to delete payment', details: error });
//     }
// });
// //Update a Payment by ID
// paymentRouter.put('/:id', async (req: Request, res: Response) => {
//     try {
//         const { order_id, transaction_id, payment_status } = req.body;

//         // Basic validation
//         if (!order_id || !transaction_id || !payment_status) {
//             return res.status(400).json({ error: 'Order ID, transaction ID, and payment status are required' });
//         }

//         const [updated] = await Payment.update({
//             order_id,
//             transaction_id,
//             payment_status,
//         }, {
//             where: { payment_id: req.params.id }
//         });

//         if (updated) {
//             const updatedPayment = await Payment.findByPk(req.params.id);
//             res.status(200).json(updatedPayment);
//         } else {
//             res.status(404).json({ error: 'Payment not found' });
//         }
//     } catch (error) {
//         res.status(500).json({ error: 'Failed to update payment', details: error });
//     }
// });
// //delete by id
// paymentRouter.delete('/:id', async (req: Request, res: Response) => {
//     try {
//         const deleted = await Payment.destroy({
//             where: { payment_id: req.params.id }
//         });
//         if (deleted) {
//             res.status(204).send();
//         } else {
//             res.status(404).json({ error: 'Payment not found' });
//         }
//     } catch (error) {
//         res.status(500).json({ error: 'Failed to delete payment', details: error });
//     }
// });


// export default paymentRouter;
import { Router, Request, Response } from 'express';
import Payment, { PaymentInput, PaymentOutput } from '../db/models/payment';
import { PaymentStatus } from '../db/models/payment';

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
    try {
        const payments: PaymentOutput[] = await Payment.findAll();
        res.status(200).json(payments);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving payments', error });
    }
});

// Get a payment by ID
paymentrouter.get('/:id', async (req: Request, res: Response) => {
    try {
        const payment = await Payment.findByPk(req.params.id);
        if (payment) {
            res.status(200).json(payment);
        } else {
            res.status(404).json({ message: 'Payment not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving payment', error });
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
