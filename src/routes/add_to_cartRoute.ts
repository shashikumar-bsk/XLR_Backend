import express from 'express';
import AddToCart from '../db/models/add_to_cart'; // Update the path as needed
import User from '../db/models/users'; // Update the path as needed
import Product from '../db/models/product'; // Update the path as needed
import Promotion from '../db/models/promotions' // Update the path as needed
import redisClient from '../../src/redis/redis'

const cartRouter = express.Router();

cartRouter.post('/', async (req, res) => {
    const { user_id, product_id, quantity, price, promotion_id, image_url } = req.body;

    if (user_id === undefined || product_id === undefined || quantity === undefined || price === undefined) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const userExists = await User.findByPk(user_id);
        if (!userExists) {
            return res.status(404).json({ message: 'User not found' });
        }

        const productExists = await Product.findByPk(product_id);
        if (!productExists) {
            return res.status(404).json({ message: 'Product not found' });
        }

        let total_price = Number(quantity) * Number(price);

        const existingItem = await AddToCart.findOne({
            where: {
                user_id,
                product_id,
                is_deleted: false
            }
        });

        if (existingItem) {
            existingItem.quantity += Number(quantity);
            existingItem.price = Number(price);
            existingItem.total_price = existingItem.quantity * existingItem.price;
            existingItem.image_url = image_url; // Update image URL
            await existingItem.save();
            return res.status(200).json(existingItem);
        }

        const newItem = await AddToCart.create({ 
            user_id, 
            product_id, 
            quantity: Number(quantity), 
            price: Number(price), 
            total_price, 
            is_deleted: false,
            promotion_id,
            image_url // Include image URL
        });
        res.status(201).json(newItem);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error adding item to cart' });
    }
});

cartRouter.post('/update-delivery-fee/:user_id', async (req, res) => {
    const { user_id } = req.params;
    const { delivery_fee } = req.body;

    if (delivery_fee === undefined || isNaN(Number(delivery_fee))) {
        return res.status(400).json({ message: 'Valid delivery fee is required' });
    }

    try {
        const numericDeliveryFee = Number(delivery_fee);
        const cartItems = await AddToCart.findAll({
            where: { user_id, is_deleted: false }
        });

        if (!cartItems.length) {
            return res.status(404).json({ message: 'No items found in cart' });
        }

        let totalPaymentBeforeFee = 0;

        for (const item of cartItems) {
            const promotion = item.promotion_id ? await Promotion.findByPk(item.promotion_id) : null;
            const discount = promotion?.discount_percentage || 0;
            const quantity = Number(item.quantity);
            const price = Number(item.price);
            totalPaymentBeforeFee += quantity * price * (1 - discount / 100);
        }

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

cartRouter.post('/apply-promotion/:user_id', async (req, res) => {
    const { user_id } = req.params;
    const { promotion_id } = req.body;

    if (!promotion_id) {
        return res.status(400).json({ message: 'Promotion ID is required' });
    }

    try {
        const promotion = await Promotion.findByPk(promotion_id);
        if (!promotion) {
            return res.status(404).json({ message: 'Promotion not found' });
        }

        const cartItems = await AddToCart.findAll({
            where: { user_id, is_deleted: false }
        });

        if (!cartItems.length) {
            return res.status(404).json({ message: 'No items found in cart' });
        }

        let totalPaymentBeforePromotion = cartItems.reduce((sum, item) => {
            const quantity = Number(item.quantity);
            const price = Number(item.price);
            const deliveryFee = item.delivery_fee ?? 0;

            return sum + (quantity * price + deliveryFee);
        }, 0);

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
    const { quantity, price, promotion_id, image_url } = req.body;

    if (quantity === undefined || price === undefined) {
        return res.status(400).json({ message: 'Quantity and price are required' });
    }

    try {
        const item = await AddToCart.findByPk(cart_id);

        if (!item || item.is_deleted) {
            return res.status(404).json({ message: 'Item not found' });
        }

        item.quantity = Number(quantity);
        item.price = Number(price);
        item.total_price = item.quantity * item.price;
        item.promotion_id = promotion_id;
        item.image_url = image_url; // Update image URL
        await item.save();
        res.status(200).json(item);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating cart item' });
    }
});
// Get specific details of items in the cart for a user and calculate total payment

cartRouter.get('/item/:cart_id', async (req, res) => {
    const { cart_id } = req.params;

    try {
        // Find the item by cart_id
        const item = await AddToCart.findOne({
            attributes: ['cart_id', 'product_id', 'quantity', 'total_price', 'image_url', 'promotion_id'],
            where: { cart_id, is_deleted: false },
            include: [
                { model: Product, as: 'product' }
            ]
        });

        if (!item) {
            return res.status(404).json({ message: 'Cart item not found' });
        }

        res.status(200).json(item);
    } catch (error) {
        console.error('Error retrieving cart item:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
cartRouter.delete('/item/:cart_id', async (req, res) => {
    const { cart_id } = req.params;

    try {
        // Find the item to delete
        const item = await AddToCart.findOne({
            where: { cart_id, is_deleted: false }
        });

        if (!item) {
            return res.status(404).json({ message: 'Cart item not found' });
        }

        // Permanently delete the item from the database
        await item.destroy();

        res.status(200).json({ message: 'Cart item removed successfully' });
    } catch (error) {
        console.error('Error removing cart item:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


cartRouter.get('/:user_id', async (req, res) => {
    const { user_id } = req.params;

    console.log(`Fetching cart items for user_id: ${user_id}`); // Debugging line

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
                attributes: ['cart_id', 'product_id', 'image_url', 'quantity', 'total_price', 'promotion_id'],
                where: { user_id, is_deleted: false },
                include: [{
                    model: Product,
                    as: 'product',
                    attributes: ['product_id', 'name', 'price', 'discount_price', 'image_id', 'quantity'] // Updated to include discount_price and quantity
                }]
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

            // Store the data in Redis with an expiration time of 2 seconds
            await redisClient.set(`cart:${user_id}`, JSON.stringify(responseData));
            await redisClient.expire(`cart:${user_id}`, 2);

            // Respond with the data fetched from the database
            res.status(200).json(responseData);
        });
    } catch (error: any) {
        console.error('Error retrieving cart items:', error); // Enhanced error logging
        res.status(500).json({ message: 'Error retrieving cart items', error: error.message });
    }
});


cartRouter.delete('/:user_id', async (req, res) => {
    const { user_id } = req.params;

    console.log(`Attempting to delete all cart items for user_id: ${user_id}`); // Debugging line

    try {
        // Permanently delete all items in the cart for the given user_id
        const deletedCount = await AddToCart.destroy({
            where: { user_id: user_id, is_deleted: false } 
        });

        console.log(`Deleted ${deletedCount} items for user_id: ${user_id}`); // Debugging line

        // Check if any rows were affected
        if (deletedCount > 0) {
            res.status(200).json({ message: 'All cart items have been removed successfully' });
        } else {
            res.status(404).json({ message: 'No cart items found for the given user_id' });
        }
    } catch (error:any) {
        console.error('Error removing all cart items:', error.message); // Enhanced error logging
        res.status(500).json({ message: 'Error removing all cart items', error: error.message });
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

            // Store the total payment in Redis with an expiration time of 2 seconds
            await redisClient.set(`cartTotal:${user_id}`, JSON.stringify(total_payment));
            await redisClient.expire(`cartTotal:${user_id}`, 2);

            // Respond with the total payment
            res.status(200).json({ total_payment });
        });
    } catch (error) {
        console.error('Error retrieving cart total payment:', error);
        res.status(500).json({ message: 'Error retrieving cart total payment' });
    }
});

// cartRouter.patch('/:cart_id', async (req, res) => {
    cartRouter.patch('/item/:cart_id', async (req, res) => {
        const { cart_id } = req.params;
        const { quantity, price, promotion_id, image_url } = req.body;
    
        // At least one of the fields should be provided
        if (quantity === undefined && price === undefined && promotion_id === undefined && image_url === undefined) {
            return res.status(400).json({ message: 'At least one field (quantity, price, promotion_id, or image_url) is required to update' });
        }
    
        try {
            // Find the cart item by ID
            const item = await AddToCart.findByPk(cart_id);
    
            if (!item || item.is_deleted) {
                return res.status(404).json({ message: 'Item not found' });
            }
    
            // Update fields conditionally
            if (quantity !== undefined) {
                item.quantity = Number(quantity);
            }
            if (price !== undefined) {
                item.price = Number(price);
            }
            if (promotion_id !== undefined) {
                item.promotion_id = promotion_id;
            }
            if (image_url !== undefined) {
                item.image_url = image_url;
            }
    
            // Always update the total price if quantity or price is updated
            if (quantity !== undefined || price !== undefined) {
                item.total_price = item.quantity * item.price;
            }
    
            // Save the changes to the database
            await item.save();
            res.status(200).json(item);
        } catch (error) {
            console.error('Error updating cart item:', error);
            res.status(500).json({ message: 'Error updating cart item' });
        }
    });
    

export default cartRouter;