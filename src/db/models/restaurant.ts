import { DataTypes, Model, Optional } from 'sequelize';
import sequelizeConnection from '../config'; // Adjust the path to your sequelize instance
import Image from '../models/image'; // Adjust the path to your Image model

interface RestaurantAttributes {
    id: number;
    name: string;
    location: string;
    phone?: string;
    rating?: number;
    opening_time?: string;
    closing_time?: string;
    image_id?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface RestaurantInput extends Optional<RestaurantAttributes, 'id'> {}
export interface RestaurantOutput extends Required<RestaurantAttributes> {}

class Restaurant extends Model<RestaurantAttributes, RestaurantInput> implements RestaurantAttributes {
    public id!: number;
    public name!: string;
    public location!: string;
    public phone?: string;
    public rating?: number;
    public opening_time?: string;
    public closing_time?: string;
    public image_id?: number;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Restaurant.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    location: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    rating: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    opening_time: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    closing_time: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    image_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Image,
            key: 'image_id',
        },
    },
}, {
    sequelize: sequelizeConnection,
    modelName: 'Restaurant',
    tableName: 'restaurants',
    timestamps: true,
    indexes: [
        {
            unique: true,
            name: 'restaurantId_index',
            fields: ['id']
        }
    ]
});

// Define the association
Restaurant.belongsTo(Image, { foreignKey: 'image_id', as: 'image' });

export default Restaurant;
