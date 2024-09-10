import express from 'express';
import AddToCart from '../db/models/add_to_cart'; // Update the path as needed
import User from '../db/models/users'; // Update the path as needed
import Product from '../db/models/product'; // Update the path as needed
import Promotion from '../db/models/promotions' // Update the path as needed
import redisClient from '../../src/redis/redis'

const cartRouter = express.Router();

cartRouter.post('/', async (req, res) => {
    const { user_id, product_id, quantity, price, promotion_id} = req.body;

    if (user_id === undefined || product_id === undefined || quantity === undefined || price === undefined) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        // Validate if the user exists
        const userExists = await User.findByPk(user_id);
        if (!userExists) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Validate if the product exists
        const productExists = await Product.findByPk(product_id);
        if (!productExists) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Calculate initial total price
        let total_price = Number(quantity) * Number(price);

        // Check if the item already exists in the cart and is not deleted
        const existingItem = await AddToCart.findOne({
            where: {
                user_id,
                product_id,
                is_deleted: false
            }
        });

        if (existingItem) {
            // Update the quantity and total_price if the item already exists
            existingItem.quantity += Number(quantity);
            existingItem.price = Number(price); // Update the price
            existingItem.total_price = existingItem.quantity * existingItem.price; // Recalculate total_price
            await existingItem.save();
            return res.status(200).json(existingItem);
        }

        // Create a new cart item
        const newItem = await AddToCart.create({ 
            user_id, 
            product_id, 
            quantity: Number(quantity), 
            price: Number(price), 
            total_price, 
            is_deleted: false,
            promotion_id
        });
        res.status(201).json(newItem);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error adding item to cart' });
    }
});

// Route to update delivery fee for all items in a user's cart
cartRouter.post('/update-delivery-fee/:user_id', async (req, res) => {
    const { user_id } = req.params;
    const { delivery_fee } = req.body;

    // Ensure delivery_fee is provided and is a number
    if (delivery_fee === undefined || isNaN(Number(delivery_fee))) {
        return res.status(400).json({ message: 'Valid delivery fee is required' });
    }

    try {
        // Convert delivery_fee to a number
        const numericDeliveryFee = Number(delivery_fee);

        // Fetch all items in the user's cart
        const cartItems = await AddToCart.findAll({
            where: { user_id, is_deleted: false }
        });

        if (!cartItems.length) {
            return res.status(404).json({ message: 'No items found in cart' });
        }

        // Calculate the total payment before applying the delivery fee
        let totalPaymentBeforeFee = 0;

        for (const item of cartItems) {
            const promotion = item.promotion_id ? await Promotion.findByPk(item.promotion_id) : null;
            const discount = promotion?.discount_percentage || 0;
            const quantity = Number(item.quantity);
            const price = Number(item.price);
            totalPaymentBeforeFee += quantity * price * (1 - discount / 100);
        }

        // Add the delivery fee to the total payment
        const totalPaymentAfterFee = totalPaymentBeforeFee + numericDeliveryFee;

        res.status(200).json({
            message: 'Delivery fee applied to total payment',
            total_payment_before_fee: totalPaymentBeforeFee,
            total_payment_after_fee: totalPaymentAfterFee
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error applying delivery fee to total payment' });
    }
});

// Route to apply a promotion to the total payment
cartRouter.post('/apply-promotion/:user_id', async (req, res) => {
    const { user_id } = req.params;
    const { promotion_id } = req.body;

    if (!promotion_id) {
        return res.status(400).json({ message: 'Promotion ID is required' });
    }

    try {
        // Validate if the promotion exists
        const promotion = await Promotion.findByPk(promotion_id);
        if (!promotion) {
            return res.status(404).json({ message: 'Promotion not found' });
        }

        // Fetch all items in the user's cart
        const cartItems = await AddToCart.findAll({
            where: { user_id, is_deleted: false }
        });

        if (!cartItems.length) {
            return res.status(404).json({ message: 'No items found in cart' });
        }

        // Calculate initial total payment before applying the promotion
        let totalPaymentBeforePromotion = cartItems.reduce((sum, item) => {
            const quantity = Number(item.quantity);
            const price = Number(item.price);
            const deliveryFee = item.delivery_fee ?? 0;

            return sum + (quantity * price + deliveryFee); // Calculate total price before promotion
        }, 0);

        // Apply the promotion to the total payment
        const discount = promotion.discount_percentage || 0;
        const totalPaymentAfterPromotion = totalPaymentBeforePromotion * (1 - discount / 100);

        res.status(200).json({
            message: 'Promotion applied to total payment',
            total_payment_before_promotion: totalPaymentBeforePromotion,
            total_payment_after_promotion: totalPaymentAfterPromotion
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error applying promotion to cart items' });
    }
});

cartRouter.put('/:cart_id', async (req, res) => {
        const { cart_id } = req.params;
        const { quantity, price, promotion_id } = req.body;
    
        if (quantity === undefined || price === undefined) {
            return res.status(400).json({ message: 'Quantity and price are required' });
        }
    
        try {
            const item = await AddToCart.findByPk(cart_id);
    
            if (!item || item.is_deleted) {
                return res.status(404).json({ message: 'Item not found' });
            }
    
            item.quantity = Number(quantity);
            item.price = Number(price); // Update the price
            item.total_price = item.quantity * item.price; // Recalculate total_price
            item.promotion_id = promotion_id; // Update promotion_id if applicable
            await item.save();
            res.status(200).json(item);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error updating cart item' });
        }
    });

// Remove item from cart (soft delete)
cartRouter.delete('/:cart_id', async (req, res) => {
    const { cart_id } = req.params;

    try {
        const item = await AddToCart.findByPk(cart_id);

        if (!item || item.is_deleted) {
            return res.status(404).json({ message: 'Item not found' });
        }

        await item.destroy(); 
        item.is_deleted = true;
        await item.save();
        res.status(200).json({ message: 'Item removed from cart' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error removing item from cart' });
    }
});
// Get specific details of items in the cart for a user and calculate total payment
cartRouter.get('/:user_id', async (req, res) => {
    const { user_id } = req.params;

    try {
        // Check if cart data is already in Redis
        redisClient.get(`cart:${user_id}`, async (err, cachedData) => {
            if (err) {
                console.error('Redis error:', err);
                return res.status(500).json({ message: 'Internal server error.' });
            }

            if (cachedData) {
                // If data is found in Redis, return it
                console.log('Cache hit, returning data from Redis');
                return res.status(200).json(JSON.parse(cachedData));
            }

            // If data is not in Redis, fetch from the database
            const items = await AddToCart.findAll({
                attributes: ['cart_id', 'product_id', 'quantity', 'total_price', 'promotion_id'],
                where: { user_id, is_deleted: false }
            });

            if (!items.length) {
                return res.status(404).json({ message: 'No items found in cart' });
            }

            // Calculate the total payment
            const totalPayment = items.reduce((sum, item) => {
                return sum + (item.total_price ?? 0); // Use 0 if total_price is undefined
            }, 0);

            const responseData = {
                user_id,
                items,
                total_payment: totalPayment
            };

            // Store the data in Redis with an expiration time of 180 seconds (3 minutes)
            await redisClient.set(`cart:${user_id}`, JSON.stringify(responseData));
            await redisClient.expire(`cart:${user_id}`, 120);

            // Respond with the data fetched from the database
            res.status(200).json(responseData);
        });
    } catch (error) {
        console.error('Error retrieving cart items:', error);
        res.status(500).json({ message: 'Error retrieving cart items' });
    }
});

cartRouter.get('/total/:user_id', async (req, res) => {
    const { user_id } = req.params;

    try {
        // Check if total payment is already in Redis
        redisClient.get(`cartTotal:${user_id}`, async (err, cachedData) => {
            if (err) {
                console.error('Redis error:', err);
                return res.status(500).json({ message: 'Internal server error.' });
            }

            if (cachedData) {
                // If data is found in Redis, return it
                console.log('Cache hit, returning data from Redis');
                return res.status(200).json({ total_payment: JSON.parse(cachedData) });
            }

            // If data is not in Redis, fetch from the database
            const items = await AddToCart.findAll({
                where: { user_id, is_deleted: false }
            });

            if (!items.length) {
                return res.status(404).json({ message: 'No items found in cart' });
            }

            // Calculate the total amount
            const total_payment = items.reduce((sum, item) => sum + item.total_price, 0);

            // Store the total payment in Redis with an expiration time of 180 seconds (3 minutes)
            await redisClient.set(`cartTotal:${user_id}`, JSON.stringify(total_payment));
            await redisClient.expire(`cartTotal:${user_id}`, 180);

            // Respond with the total payment
            res.status(200).json({ total_payment });
        });
    } catch (error) {
        console.error('Error retrieving cart total payment:', error);
        res.status(500).json({ message: 'Error retrieving cart total payment' });
    }
});

export default cartRouter;
