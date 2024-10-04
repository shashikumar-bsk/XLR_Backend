import { DataTypes, Model, Optional } from 'sequelize';
import sequelizeConnection from '../config';
import Image from './image'; // Adjust the path to your Image model

interface DishAttributes {
    id: number;
    restaurant_id: number;
    name: string;
    description?: string;
    price: number;
    image_id: number;
    availability: boolean; // Add this field for dish availability
    createdAt?: Date;
    updatedAt?: Date;
}

export interface DishInput extends Optional<DishAttributes, 'id'> { }
export interface DishOutput extends Required<DishAttributes> { }

class Dish extends Model<DishAttributes, DishInput> implements DishAttributes {
    public id!: number;
    public restaurant_id!: number;
    public name!: string;
    public description?: string;
    public price!: number;
    public image_id!: number;
    public availability!: boolean; // Ensure the availability is part of the class

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Dish.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    restaurant_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'restaurants',
            key: 'id',
        },
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    image_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'images',
            key: 'image_id',
        },
    },
    availability: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true, // Assume dish is available by default
    },
}, {
    sequelize: sequelizeConnection,
    modelName: 'Dish',
    tableName: 'dishes',
    timestamps: true,
    indexes: [
        {
            unique: true,
            name: 'dishesId_index',
            fields: ['id'],
        },
    ],
});

Dish.belongsTo(Image, { foreignKey: 'image_id', as: 'image' });

export default Dish;
