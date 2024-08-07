"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dish_1 = __importDefault(require("../db/models/dish")); // Adjust the path to your Dish model
const restaurant_1 = __importDefault(require("../db/models/restaurant")); // Ensure Restaurant is imported correctly
const image_1 = __importDefault(require("../db/models/image")); // Ensure Image is imported correctly
const dishRouter = express_1.default.Router();
// Create a new dish
dishRouter.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { restaurant_id, name, description, price, image_id } = req.body;
        // Basic validation
        if (!restaurant_id || !name || !price || !image_id) {
            return res.status(400).json({ error: 'Restaurant ID, name, price, and image ID are required' });
        }
        const newDish = yield dish_1.default.create({
            restaurant_id,
            name,
            description,
            price,
            image_id
        });
        res.status(201).json(newDish);
    }
    catch (error) {
        console.error('Error creating dish:', error);
        res.status(500).json({ error: 'Failed to create dish' });
    }
}));
// Get all dishes
dishRouter.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const dishes = yield dish_1.default.findAll({
            include: [
                {
                    model: restaurant_1.default,
                    as: 'restaurant',
                    attributes: ['id', 'name'] // Adjust attributes as needed
                },
                {
                    model: image_1.default,
                    attributes: ['id', 'url'] // Adjust attributes as needed
                }
            ]
        });
        const dishOutput = dishes.map(dish => dish.get({ plain: true }));
        res.status(200).json(dishOutput);
    }
    catch (error) {
        console.error('Error fetching dishes:', error);
        res.status(500).json({ error: 'Failed to fetch dishes' });
    }
}));
// Get a dish by ID
dishRouter.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const dish = yield dish_1.default.findByPk(id, {
            include: [
                {
                    model: restaurant_1.default,
                    as: 'restaurant',
                    attributes: ['id', 'name'] // Adjust attributes as needed
                },
                {
                    model: image_1.default,
                    attributes: ['id', 'url'] // Adjust attributes as needed
                }
            ]
        });
        if (dish) {
            const dishOutput = dish.get({ plain: true });
            res.status(200).json(dishOutput);
        }
        else {
            res.status(404).json({ error: 'Dish not found' });
        }
    }
    catch (error) {
        console.error('Error fetching dish:', error);
        res.status(500).json({ error: 'Failed to fetch dish' });
    }
}));
// Update a dish by ID
dishRouter.patch('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { restaurant_id, name, description, price, image_id } = req.body;
        // Basic validation
        if (!name && !price && !restaurant_id && !description && !image_id) {
            return res.status(400).json({ error: 'At least one field is required to update' });
        }
        const [updated] = yield dish_1.default.update({
            restaurant_id,
            name,
            description,
            price,
            image_id
        }, {
            where: { id },
            returning: true
        });
        if (updated) {
            const updatedDish = yield dish_1.default.findByPk(id, {
                include: [
                    {
                        model: restaurant_1.default,
                        as: 'restaurant',
                        attributes: ['id', 'name'] // Adjust attributes as needed
                    },
                    {
                        model: image_1.default,
                        attributes: ['id', 'url'] // Adjust attributes as needed
                    }
                ]
            });
            if (updatedDish) {
                const dishOutput = updatedDish.get({ plain: true });
                res.status(200).json(dishOutput);
            }
            else {
                res.status(404).json({ error: 'Dish not found' });
            }
        }
        else {
            res.status(404).json({ error: 'Dish not found' });
        }
    }
    catch (error) {
        console.error('Error updating dish:', error);
        res.status(500).json({ error: 'Failed to update dish' });
    }
}));
// Delete a dish by ID
dishRouter.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const deleted = yield dish_1.default.destroy({
            where: { id }
        });
        if (deleted) {
            res.status(204).send();
        }
        else {
            res.status(404).json({ error: 'Dish not found' });
        }
    }
    catch (error) {
        console.error('Error deleting dish:', error);
        res.status(500).json({ error: 'Failed to delete dish' });
    }
}));
exports.default = dishRouter;
