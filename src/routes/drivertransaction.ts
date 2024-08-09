import express, { Request, Response } from 'express';
import DriverTransaction from '../db/models/drivertransaction'; // Adjust the path as needed

const driverTransactionRouter = express.Router();

// Utility function to get the latest wallet balance for a driver
const getLatestWalletBalance = async (driver_id: number) => {
    const latestTransaction = await DriverTransaction.findOne({
        where: { driver_id },
        order: [['transaction_date', 'DESC']]
    });
    return latestTransaction ? latestTransaction.wallet_balance_after : 0;
};

// Create a new transaction
driverTransactionRouter.post('/', async (req: Request, res: Response) => {
    try {
        const { driver_id, amount, transaction_type, description, request_id } = req.body;

        // Convert amount to a number
        const amountNum = parseFloat(amount);

        // Get the latest wallet balance
        const wallet_balance_before = await getLatestWalletBalance(driver_id);

        // Calculate the new balance
        let wallet_balance_after: number;

        if (transaction_type === 'credit') {
            wallet_balance_after = wallet_balance_before + amountNum;
        } else {
            wallet_balance_after = wallet_balance_before - amountNum;
        }

        // Create the transaction record
        const transaction = await DriverTransaction.create({
            driver_id,
            request_id,
            wallet_balance_before,
            wallet_balance_after,
            amount: amountNum, // Ensure amount is a number
            transaction_type,
            description,
            transaction_date: new Date()
        });

        res.status(201).json(transaction);
    } catch (error) {
        const err = error as Error;
        res.status(500).json({ error: err.message });
    }
});

// Get all transactions for a driver
driverTransactionRouter.get('/:driver_id', async (req: Request, res: Response) => {
    try {
        const { driver_id } = req.params;

        // Fetch the latest wallet balance for the driver
        const latestWalletBalance = await getLatestWalletBalance(Number(driver_id));

        // Fetch all transactions for the driver
        const transactions = await DriverTransaction.findAll({
            where: { driver_id },
            attributes: ['transaction_id', 'amount', 'wallet_balance_before', 'wallet_balance_after', 'transaction_type', 'description', 'request_id', 'transaction_date'],
            order: [['transaction_date', 'DESC']]
        });

        if (transactions.length === 0) {
            return res.status(404).json({ message: 'No transactions found for this driver' });
        }

        // Respond with driver details and transactions including the latest wallet balance
        res.status(200).json({
            driver_id,
            latest_wallet_balance: latestWalletBalance,
            transactions
        });
    } catch (error) {
        const err = error as Error;
        res.status(500).json({ error: err.message });
    }
});

// Get the latest balance for a driver
driverTransactionRouter.get('/balance/:driver_id', async (req: Request, res: Response) => {
    try {
        const { driver_id } = req.params;

        const latestTransaction = await DriverTransaction.findOne({
            where: { driver_id },
            order: [['transaction_date', 'DESC']]
        });

        if (latestTransaction) {
            res.status(200).json({ balance: latestTransaction.wallet_balance_after });
        } else {
            res.status(404).json({ message: 'No transactions found for this driver' });
        }
    } catch (error) {
        const err = error as Error;
        res.status(500).json({ error: err.message });
    }
});

export default driverTransactionRouter;
