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
const restaurant_1 = __importDefault(require("../db/models/restaurant")); // Adjust the path to your Restaurant model
const image_1 = __importDefault(require("../db/models/image")); // Ensure Image is imported correctly
const restaurantRouter = express_1.default.Router();
// Create a new restaurant
restaurantRouter.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, location, phone, rating, opening_time, closing_time, image_id } = req.body;
        // Basic validation
        if (!name || !location || !image_id) {
            return res.status(400).json({ error: 'Name, location, and image ID are required' });
        }
        const newRestaurant = yield restaurant_1.default.create({
            name,
            location,
            phone,
            rating,
            opening_time,
            closing_time,
            image_id
        });
        res.status(201).json(newRestaurant);
    }
    catch (error) {
        console.error('Error creating restaurant:', error);
        res.status(500).json({ error: 'Failed to create restaurant' });
    }
}));
// Get all restaurants
restaurantRouter.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const restaurants = yield restaurant_1.default.findAll({
            include: {
                model: image_1.default,
                attributes: ['id', 'url'] // Adjust attributes as needed
            }
        });
        const restaurantOutput = restaurants.map(restaurant => restaurant.get({ plain: true }));
        res.status(200).json(restaurantOutput);
    }
    catch (error) {
        console.error('Error fetching restaurants:', error);
        res.status(500).json({ error: 'Failed to fetch restaurants' });
    }
}));
// Get a restaurant by ID
restaurantRouter.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const restaurant = yield restaurant_1.default.findByPk(id, {
            include: {
                model: image_1.default,
                attributes: ['id', 'url'] // Adjust attributes as needed
            }
        });
        if (restaurant) {
            const restaurantOutput = restaurant.get({ plain: true });
            res.status(200).json(restaurantOutput);
        }
        else {
            res.status(404).json({ error: 'Restaurant not found' });
        }
    }
    catch (error) {
        console.error('Error fetching restaurant:', error);
        res.status(500).json({ error: 'Failed to fetch restaurant' });
    }
}));
// Update a restaurant by ID
restaurantRouter.patch('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, location, phone, rating, opening_time, closing_time, image_id } = req.body;
        // Basic validation
        if (!name && !location && !phone && !rating && !opening_time && !closing_time && !image_id) {
            return res.status(400).json({ error: 'At least one field is required to update' });
        }
        const [updated] = yield restaurant_1.default.update({
            name,
            location,
            phone,
            rating,
            opening_time,
            closing_time,
            image_id
        }, {
            where: { id },
            returning: true
        });
        if (updated) {
            const updatedRestaurant = yield restaurant_1.default.findByPk(id, {
                include: {
                    model: image_1.default,
                    attributes: ['id', 'url'] // Adjust attributes as needed
                }
            });
            if (updatedRestaurant) {
                const restaurantOutput = updatedRestaurant.get({ plain: true });
                res.status(200).json(restaurantOutput);
            }
            else {
                res.status(404).json({ error: 'Restaurant not found' });
            }
        }
        else {
            res.status(404).json({ error: 'Restaurant not found' });
        }
    }
    catch (error) {
        console.error('Error updating restaurant:', error);
        res.status(500).json({ error: 'Failed to update restaurant' });
    }
}));
// Delete a restaurant by ID
restaurantRouter.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const deleted = yield restaurant_1.default.destroy({
            where: { id }
        });
        if (deleted) {
            res.status(204).send();
        }
        else {
            res.status(404).json({ error: 'Restaurant not found' });
        }
    }
    catch (error) {
        console.error('Error deleting restaurant:', error);
        res.status(500).json({ error: 'Failed to delete restaurant' });
    }
}));
exports.default = restaurantRouter;
