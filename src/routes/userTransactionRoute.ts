import express, { Request, Response } from 'express';
import Transaction from '../db/models/userTransaction'; // Adjust the path as needed

const transactionRouter = express.Router();

// Utility function to get the latest wallet balance for a user
const getLatestWalletBalance = async (user_id: number) => {
    const latestTransaction = await Transaction.findOne({
        where: { user_id },
        order: [['transaction_date', 'DESC']]
    });

    return latestTransaction ? latestTransaction.wallet_balance_after : 0;
};

// Create a new transaction
transactionRouter.post('/', async (req: Request, res: Response) => {
    try {
        const { user_id, amount, transaction_type, description, reference_id } = req.body;

        // Convert amount to a number
        const amountNum = parseFloat(amount);

        // Get the latest wallet balance
        const wallet_balance_before = await getLatestWalletBalance(user_id);

        // Calculate the new balance
        let wallet_balance_after: number;

        if (transaction_type === 'credit') {
            wallet_balance_after = wallet_balance_before + amountNum;
        } else {
            wallet_balance_after = wallet_balance_before - amountNum;
        }

        // Create the transaction record
        const transaction = await Transaction.create({
            user_id,
            wallet_balance_before,
            wallet_balance_after,
            amount: amountNum, // Ensure amount is a number
            transaction_type,
            description,
            reference_id,
            transaction_date: new Date()
        });

        res.status(201).json(transaction);
    } catch (error) {
        const err = error as Error;
        res.status(500).json({ error: err.message });
    }
});

// Get all transactions for a user
// transactionRouter.get('/:user_id', async (req: Request, res: Response) => {
//     try {
//         const { user_id } = req.params;

//         const transactions = await Transaction.findAll({
//             where: { user_id }
//         });

//         res.status(200).json(transactions);
//     } catch (error) {
//         const err = error as Error;
//         res.status(500).json({ error: err.message });
//     }
// });

transactionRouter.get('/:user_id', async (req: Request, res: Response) => {
    try {
        const { user_id } = req.params;

        // Fetch the latest wallet balance for the user
        const latestWalletBalance = await getLatestWalletBalance(Number(user_id));

        // Fetch all transactions for the user
        const transactions = await Transaction.findAll({
            where: { user_id },
            attributes: ['amount', 'wallet_balance_before' , 'wallet_balance_after' , 'transaction_type', 'description', 'transaction_date'],
            // order: [['transaction_date', 'DESC']]
        });

        if (transactions.length === 0) {
            return res.status(404).json({ message: 'No transactions found for this user' });
        }

        // Respond with user details and transactions including the latest wallet balance
        res.status(200).json({
            user_id,
            latest_wallet_balance: latestWalletBalance,
            transactions
        });
    } catch (error) {
        const err = error as Error;
        res.status(500).json({ error: err.message });
    }
});


// Get the latest balance for a user
transactionRouter.get('/balance/:user_id', async (req: Request, res: Response) => {
    try {
        const { user_id } = req.params;

        const latestTransaction = await Transaction.findOne({
            where: { user_id },
            order: [['transaction_date', 'DESC']]
        });

        if (latestTransaction) {
            res.status(200).json({ balance: latestTransaction.wallet_balance_after });
        } else {
            res.status(404).json({ message: 'No transactions found for this user' });
        }
    } catch (error) {
        const err = error as Error;
        res.status(500).json({ error: err.message });
    }
});

export default transactionRouter;
