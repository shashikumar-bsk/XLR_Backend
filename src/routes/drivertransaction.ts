import express, { Request, Response } from 'express';
import DriverTransaction from '../db/models/drivertransaction'; // Adjust the path as needed
import redisClient from '../../src/redis/redis'

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
    const { driver_id } = req.params;

    // Define the cache key for the driver transactions
    const cacheKey = `driver:transactions:${driver_id}`;

    try {
        // Check if the driver transactions are already in Redis
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

            // Prepare the response data
            const responseData = {
                driver_id,
                latest_wallet_balance: latestWalletBalance,
                transactions
            };

            // Store the response data in Redis with an expiration time of 2 seconds
            await redisClient.set(cacheKey, JSON.stringify(responseData));
            await redisClient.expire(cacheKey, 2);

            // Respond with the driver details and transactions including the latest wallet balance
            res.status(200).json(responseData);
        });
    } catch (error) {
        const err = error as Error;
        console.error('Error fetching driver transactions:', err);
        res.status(500).json({ error: err.message });
    }
});


// Get the latest balance for a driver
driverTransactionRouter.get('/balance/:driver_id', async (req: Request, res: Response) => {
    const { driver_id } = req.params;

    // Define the cache key for the driver's latest balance
    const cacheKey = `driver:balance:${driver_id}`;

    try {
        // Check if the latest balance is already in Redis
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

            // Fetch the latest transaction for the driver
            const latestTransaction = await DriverTransaction.findOne({
                where: { driver_id },
                order: [['transaction_date', 'DESC']]
            });

            if (latestTransaction) {
                const balance = latestTransaction.wallet_balance_after;

                // Store the balance in Redis with an expiration time of 2 seconds
                await redisClient.set(cacheKey, JSON.stringify({ balance }));
                await redisClient.expire(cacheKey, 2);

                // Respond with the balance
                res.status(200).json({ balance });
            } else {
                res.status(404).json({ message: 'No transactions found for this driver' });
            }
        });
    } catch (error) {
        const err = error as Error;
        console.error('Error fetching driver balance:', err);
        res.status(500).json({ error: err.message });
    }
});


export default driverTransactionRouter;
