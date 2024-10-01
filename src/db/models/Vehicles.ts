import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config'; // Adjust the path to your Sequelize instance
import Image from './image'; // Adjust the path to your Image model

// Define the attributes for the Vehicle model
interface VehicleAttributes {
    id: number;
    name: string;
    weightCapacity: number;
    type: '2 Wheeler' | '3 Wheeler' | '4 Wheeler' | '6 Wheeler';
    deliveryTime: number;
    image_id?: number; // Optional image_id for the associated image
    createdAt?: Date;
    updatedAt?: Date;
}

// Define input interface (for creating a new Vehicle) where 'id' is optional
export interface VehicleInput extends Optional<VehicleAttributes, 'id'> { }

// Define output interface (after a Vehicle is created)
export interface VehicleOutput extends Required<VehicleAttributes> { }

// Define the Vehicle model class
class Vehicle extends Model<VehicleAttributes, VehicleInput> implements VehicleAttributes {
    public id!: number;
    public name!: string;
    public weightCapacity!: number;
    public type!: '2 Wheeler' | '3 Wheeler' | '4 Wheeler' | '6 Wheeler';
    public deliveryTime!: number;
    public image_id?: number; // Optional image_id

    // Timestamps
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    static associate: (models: any) => void;
}

// Initialize the Vehicle model
Vehicle.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        weightCapacity: {
            type: DataTypes.INTEGER,
            allowNull: false, // Weight in kilograms (kg)
        },
        type: {
            type: DataTypes.ENUM('2 Wheeler', '3 Wheeler', '4 Wheeler', '6 Wheeler'),
            allowNull: false,
        },
        deliveryTime: {
            type: DataTypes.INTEGER,
            allowNull: false, // Time in minutes
        },
        image_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: Image,
                key: 'image_id', // Ensure this matches the primary key of the Image model
            },
        },
    },
    {
        sequelize, // Your Sequelize instance
        tableName: 'Vehicles', // Table name in the database
        timestamps: true, // Automatically manages createdAt and updatedAt
    }
);

// Define associations
Vehicle.associate = (models) => {
    Vehicle.hasMany(models.Fare, {
        foreignKey: 'vehicleId',
        as: 'fares',
    });
    Vehicle.belongsTo(Image, {
        foreignKey: 'image_id',
        as: 'image',
    });
};

export default Vehicle;
