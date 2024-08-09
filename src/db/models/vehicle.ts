import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config'; // adjust the path to your Sequelize instance

// Define attributes for the Vehicle model
interface VehicleAttributes {
    id: number;
    name: string;
    capacity: string;
    image?: string;
    price: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface VehicleInput extends Optional<VehicleAttributes, 'id'> {}
export interface VehicleOutput extends Required<VehicleAttributes> {}

// Define the Vehicle model
class Vehicle extends Model<VehicleAttributes, VehicleInput> implements VehicleAttributes {
    public id!: number;
    public name!: string;
    public capacity!: string;
    public image?: string;
    public price!: number;

    // Timestamps
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

// Initialize the model
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
        capacity: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        image: {
            type: DataTypes.TEXT,
            allowNull: true, // Allow image to be null
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        }
    },
    {
        sequelize,
        tableName: 'vehicles',
        timestamps: true,
    }
);

export default Vehicle;