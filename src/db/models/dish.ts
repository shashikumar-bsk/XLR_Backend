import { DataTypes, Model, Optional } from 'sequelize';
import sequelizeConnection from '../config'; // Adjust the path to your sequelize instance
import Image from './image'; // Adjust the path to your Image model

interface DishAttributes {
    id: number;
    restaurant_id: number;
    name: string;
    description?: string;
    price: number;
    image_id: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface DishInput extends Optional<DishAttributes, 'id'> {}
export interface DishOutput extends Required<DishAttributes> {}

class Dish extends Model<DishAttributes, DishInput> implements DishAttributes {
    public id!: number;
    public restaurant_id!: number;
    public name!: string;
    public description?: string;
    public price!: number;
    public image_id!: number;

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
            model: 'restaurants', // Name of the restaurant table
            key: 'id'
        }
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
            model: 'images', // Name of the image table
            key: 'image_id'
        }
    },
}, {
    sequelize: sequelizeConnection,
    modelName: 'Dish',
    tableName: 'dishes', // Adjust if necessary
    timestamps: true,
    indexes: [
        {
            unique: true,
            name: 'dishesId_index',
            fields: ['id']
        }
    ]
});

Dish.belongsTo(Image, { foreignKey: 'image_id' });

export default Dish;
