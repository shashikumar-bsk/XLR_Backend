import express, { Request, Response } from 'express';
import CartItem from '../db/models/CartItemRestaurants';
import Dish from '../db/models/dish';
import Image from '../db/models/image';

const RestaurantCartRouter = express.Router();

// Get all cart items for a user
RestaurantCartRouter.get('/cart-items/:user_id', async (req: Request, res: Response) => {
    const { user_id } = req.params; // Changed from req.body to req.params
    console.log("User ID:", user_id);
    try {
        const cartItems = await CartItem.findAll({
            where: { user_id: user_id, is_deleted: false }, // Only fetch items that are not deleted
            include: [{
                model: Dish,
                include: [{ model: Image, as: 'image' }] // Correctly include Image with alias 'image'
            }],
        });

        // Calculate total price for each cart item
        const cartItemsWithTotalPrice = await Promise.all(cartItems.map(async item => {
            await item.calculateTotalPrice(); // Ensure total price is calculated
            return item.toJSON();
        }));

        res.status(200).json(cartItemsWithTotalPrice);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch cart items', error });
    }
});

// Add an item to the cart
RestaurantCartRouter.post('/cart-items', async (req: Request, res: Response) => {
    try {
        const { user_id, dish_id, restaurant_id, quantity } = req.body;

        // Basic validation
        if (!user_id || !dish_id || !restaurant_id || !quantity) {
            return res.status(400).json({ success: false, error: 'Required fields are missing' });
        }

        // Fetch the associated image_id based on dish_id
        const dish = await Dish.findByPk(dish_id, {
            include: [{ model: Image, as: 'image' }] // Ensure 'as' alias is correctly used here
        });

        if (!dish || !dish.image_id) {
            return res.status(404).json({ success: false, error: 'Dish or associated image not found.' });
        }

        const newCartItem = await CartItem.create({
            user_id,
            dish_id,
            restaurant_id,
            quantity,
            image_id: dish.image_id // Set the image_id based on the associated dish
        });

        // Calculate total price
        await newCartItem.calculateTotalPrice();

        // Save with the calculated total price
        await newCartItem.save();

        res.status(201).json({ success: true, data: newCartItem });
    } catch (error) {
        console.error('Error in /cart-items:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
});

// Update an item in the cart
RestaurantCartRouter.put('/cart-items/put/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { quantity } = req.body;
    try {
        const cartItem = await CartItem.findByPk(id);
        if (!cartItem) {
            return res.status(404).json({ message: 'Cart item not found' });
        }
        cartItem.quantity = quantity;
        await cartItem.calculateTotalPrice(); // Recalculate total price
        await cartItem.save(); // Save with the recalculated total price
        res.status(200).json(cartItem);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update cart item', error });
    }
});

// Patch (partially update) an item in the cart
RestaurantCartRouter.patch('/cart-items/patch/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body; // The fields to be updated

    try {
        const cartItem = await CartItem.findByPk(id);
        if (!cartItem) {
            return res.status(404).json({ message: 'Cart item not found' });
        }

        // Apply updates
        Object.assign(cartItem, updates);

        // Calculate total price if quantity is updated
        if (updates.quantity !== undefined) {
            await cartItem.calculateTotalPrice();
        }

        await cartItem.save(); // Save with the updated fields
        res.status(200).json(cartItem);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update cart item', error });
    }
});

// Remove an item from the cart (soft delete)
RestaurantCartRouter.delete('/cart-items/delete/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const rowsDeleted = await CartItem.destroy({
            where: {
                id
            }
        });

        if (rowsDeleted === 0) {
            return res.status(404).json({ message: 'Cart item not found' });
        }

        res.status(200).json({ message: 'Cart item successfully deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete cart item', error });
    }
});

// Remove all cart items for a user (soft delete)
RestaurantCartRouter.delete('/:user_id', async (req: Request, res: Response) => {
    const { user_id } = req.params; // Destructure user_id from params
    try {
        // Delete all cart items for the specified user
        const deletedRows = await CartItem.destroy({
            where: { user_id: user_id, is_deleted: false } // Only delete items that are not already deleted
        });

        if (deletedRows === 0) {
            return res.status(404).json({ message: 'No cart items found for this user' });
        }

        res.status(200).json({ message: 'All cart items deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete all cart items', error });
    }
});

export default RestaurantCartRouter;
