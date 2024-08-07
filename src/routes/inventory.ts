import express, { Request, Response } from 'express';
import Inventory from '../db/models/inventory'; // Adjust the path to your Inventory model
import Product from '../db/models/product'; // Adjust the path to your Product model

const inventoryRouter = express.Router();

// Create a new inventory
inventoryRouter.post('/', async (req: Request, res: Response) => {
    try {
        const { product_id, quantity, warehouse_location, restock_date } = req.body;

        // Basic validation
        if (!product_id || !quantity || !warehouse_location || !restock_date) {
            return res.status(400).json({ error: 'Product ID, quantity, warehouse location, and restock date are required' });
        }

        const newInventory = await Inventory.create({
            product_id,
            quantity,
            warehouse_location,
            restock_date
        });
        res.status(201).json(newInventory);
    } catch (error) {
        console.error('Error creating inventory:', error);
        res.status(500).json({ error: 'Failed to create inventory' });
    }
});

// Get all inventories
inventoryRouter.get('/', async (req: Request, res: Response) => {
    try {
        const inventories = await Inventory.findAll({
            include: {
                model: Product,
                attributes: ['id', 'name'] // Adjust attributes as needed
            }
        });
        const inventoryOutput = inventories.map(inventory => inventory.get({ plain: true }));
        res.status(200).json(inventoryOutput);
    } catch (error) {
        console.error('Error fetching inventories:', error);
        res.status(500).json({ error: 'Failed to fetch inventories' });
    }
});

// Get an inventory by ID
inventoryRouter.get('/:inventory_id', async (req: Request, res: Response) => {
    try {
        const { inventory_id } = req.params;
        const inventory = await Inventory.findByPk(inventory_id, {
            include: {
                model: Product,
                attributes: ['id', 'name'] // Adjust attributes as needed
            }
        });
        if (inventory) {
            const inventoryOutput = inventory.get({ plain: true });
            res.status(200).json(inventoryOutput);
        } else {
            res.status(404).json({ error: 'Inventory not found' });
        }
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ error: 'Failed to fetch inventory' });
    }
});

// Update an inventory by ID
inventoryRouter.patch('/:inventory_id', async (req: Request, res: Response) => {
    try {
        const { inventory_id } = req.params;
        const { product_id, quantity, warehouse_location, restock_date } = req.body;

        // Basic validation
        if (!product_id && !quantity && !warehouse_location && !restock_date) {
            return res.status(400).json({ error: 'At least one field is required to update' });
        }

        const [updated] = await Inventory.update({
            product_id,
            quantity,
            warehouse_location,
            restock_date
        }, {
            where: { inventory_id },
            returning: true
        });

        if (updated) {
            const updatedInventory = await Inventory.findByPk(inventory_id);
            if (updatedInventory) {
                const inventoryOutput = updatedInventory.get({ plain: true });
                res.status(200).json(inventoryOutput);
            } else {
                res.status(404).json({ error: 'Inventory not found' });
            }
        } else {
            res.status(404).json({ error: 'Inventory not found' });
        }
    } catch (error) {
        console.error('Error updating inventory:', error);
        res.status(500).json({ error: 'Failed to update inventory' });
    }
});

// Delete an inventory by ID
inventoryRouter.delete('/:inventory_id', async (req: Request, res: Response) => {
    try {
        const { inventory_id } = req.params;
        const deleted = await Inventory.destroy({
            where: { inventory_id }
        });
        if (deleted) {
            res.status(204).send();
        } else {
            res.status(404).json({ error: 'Inventory not found' });
        }
    } catch (error) {
        console.error('Error deleting inventory:', error);
        res.status(500).json({ error: 'Failed to delete inventory' });
    }
});

export default inventoryRouter;
