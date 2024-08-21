import { DataTypes, Model, Optional } from 'sequelize';
import sequelizeConnection from '../config';
import Dish from './dish';
import Restaurant from './restaurant';
import Image from './image'; 

interface CartItemAttributes {
    id: number;
    user_id: number;
    dish_id: number;
    restaurant_id: number;
    quantity: number;
    totalPrice?: number;
    is_deleted?: boolean; 
    image_id: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CartItemInput extends Optional<CartItemAttributes, 'id'> {}
export interface CartItemOutput extends Required<CartItemAttributes> {}

class CartItemRest extends Model<CartItemAttributes, CartItemInput> implements CartItemAttributes {
    public id!: number;
    public user_id!: number;
    public dish_id!: number;
    public restaurant_id!: number;
    public quantity!: number;
    public totalPrice?: number;
    public is_deleted?: boolean;
    public image_id!: number;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Calculate total price based on quantity and dish price
    public async calculateTotalPrice(): Promise<void> {
        const dish = await Dish.findByPk(this.dish_id);
        if (dish) {
            this.totalPrice = dish.price * this.quantity; // Assuming 'price' is a field in Dish model
        }
    }
}

CartItemRest.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    dish_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Dish,
            key: 'id',
        },
    },
    restaurant_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Restaurant,
            key: 'id',
        },
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    totalPrice: {
        type: DataTypes.FLOAT, // Use FLOAT or DECIMAL based on your needs
        allowNull: true, // Can be null initially, updated when the item is created or updated
    },
    is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false, // Default to false
    },
    image_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'images', // Name of the image table
            key: 'image_id'
        }
    },
}, {
    sequelize: sequelizeConnection,
    modelName: 'CartItemRest',
    tableName: 'CartItemRest',
    timestamps: true,
});

// Update totalPrice on save
CartItemRest.beforeSave(async (CartItemRest: CartItemRest) => {
    if (!CartItemRest.is_deleted) { // Only calculate if not deleted
        await CartItemRest.calculateTotalPrice();
    }
});

CartItemRest.belongsTo(Dish, { foreignKey: 'dish_id' });
CartItemRest.belongsTo(Restaurant, { foreignKey: 'restaurant_id' });
CartItemRest.belongsTo(Image, { foreignKey: 'image_id', as: "image" });   


export default CartItemRest;
