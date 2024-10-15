import express, { Request, Response } from 'express';
import Transaction from '../db/models/userTransaction'; // Adjust the path as needed
import redisClient from '../../src/redis/redis'

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
    const { user_id } = req.params;
    const cacheKey = `userTransactions:${user_id}`; // Define a cache key based on user ID

    try {
        // Check if the transactions and wallet balance are already in Redis
        redisClient.get(cacheKey, async (err, cachedData) => {
            if (err) {
                console.error('Redis error:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            if (cachedData) {
                // If data is found in Redis, parse and return it
                console.log('Cache hit, returning data from Redis');
                return res.status(200).json(JSON.parse(cachedData));
            }

            // Fetch the latest wallet balance for the user
            const latestWalletBalance = await getLatestWalletBalance(Number(user_id));

            // Fetch all transactions for the user
            const transactions = await Transaction.findAll({
                where: { user_id },
                attributes: ['amount', 'wallet_balance_before', 'wallet_balance_after', 'transaction_type', 'description', 'transaction_date'],
                // order: [['transaction_date', 'DESC']]
            });

            if (transactions.length === 0) {
                return res.status(404).json({ message: 'No transactions found for this user' });
            }

            // Prepare the response data
            const responseData = {
                user_id,
                latest_wallet_balance: latestWalletBalance,
                transactions
            };

            // Store the transactions and wallet balance in Redis with an expiration time of 2 seconds
            await redisClient.set(cacheKey, JSON.stringify(responseData));
            await redisClient.expire(cacheKey, 2);

            // Respond with the user details and transactions
            res.status(200).json(responseData);
        });
    } catch (error) {
        const err = error as Error;
        console.error("Error in fetching transactions and wallet balance:", err);
        res.status(500).json({ error: err.message });
    }
});



// Get the latest balance for a user
transactionRouter.get('/balance/:user_id', async (req: Request, res: Response) => {
    const { user_id } = req.params;
    const cacheKey = `userBalance:${user_id}`; // Define a cache key based on user ID

    try {
        // Check if the balance is already in Redis
        redisClient.get(cacheKey, async (err, cachedData) => {
            if (err) {
                console.error('Redis error:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            if (cachedData) {
                // If data is found in Redis, parse and return it
                console.log('Cache hit, returning data from Redis');
                return res.status(200).json({ balance: JSON.parse(cachedData) });
            }

            // Fetch the latest transaction for the user
            const latestTransaction = await Transaction.findOne({
                where: { user_id },
                order: [['transaction_date', 'DESC']]
            });

            if (latestTransaction) {
                // Prepare the balance data
                const balance = latestTransaction.wallet_balance_after;

                // Store the balance in Redis with an expiration time of 2 seconds
                await redisClient.set(cacheKey, JSON.stringify(balance));
                await redisClient.expire(cacheKey, 2);

                // Respond with the balance
                res.status(200).json({ balance });
            } else {
                res.status(404).json({ message: 'No transactions found for this user' });
            }
        });
    } catch (error) {
        const err = error as Error;
        console.error("Error in fetching user balance:", err);
        res.status(500).json({ error: err.message });
    }
});


export default transactionRouter;
