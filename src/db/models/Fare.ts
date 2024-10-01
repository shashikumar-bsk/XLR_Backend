
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config'; // Adjust the path to your Sequelize instance
import Vehicle from '../models/Vehicles'; // Import the Vehicle model for the association

// Define the attributes for the Fare model
interface FareAttributes {
    id: number;
    vehicleId: number; // Foreign key for the vehicle
    basePrice: number; // Base price for the fare
    pricePerKm: number; // Price per kilometer
    discount?: number; // Optional discount on the base price
    finalPrice: number; // Final calculated price
    estimatedTime: number; // Estimated delivery time in minutes
    createdAt?: Date;
    updatedAt?: Date;
}

// Define input interface (for creating a new Fare) where 'id' is optional
export interface FareInput extends Optional<FareAttributes, 'id'> { }

// Define output interface (after a Fare is created)
export interface FareOutput extends Required<FareAttributes> { }

// Define the Fare model class
class Fare extends Model<FareAttributes, FareInput> implements FareAttributes {
    public id!: number;
    public vehicleId!: number;
    public basePrice!: number;
    public pricePerKm!: number;
    public discount?: number;
    public finalPrice!: number;
    public estimatedTime!: number;

    // Timestamps
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    static associate: () => void;

    // Method to calculate fare based on distance (in kilometers)
    public static calculateFare(
        basePrice: number,
        pricePerKm: number,
        distance: number,
        discount: number = 0
    ): number {
        // Calculate the total fare based on the distance
        const totalFare = basePrice + (pricePerKm * distance);

        // Apply discount if applicable
        const finalPrice = totalFare - (totalFare * (discount / 100));

        return parseFloat(finalPrice.toFixed(2)); // Return final price rounded to 2 decimal places
    }
}

// Initialize the Fare model
Fare.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        vehicleId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Vehicles', // Foreign key to Vehicle table
                key: 'id',
            },
            allowNull: false,
        },
        basePrice: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        pricePerKm: {
            type: DataTypes.FLOAT,
            allowNull: false, // Rate per kilometer
        },
        discount: {
            type: DataTypes.FLOAT, // Discount can be null
            allowNull: true,
        },
        finalPrice: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        estimatedTime: {
            type: DataTypes.INTEGER, // Time in minutes
            allowNull: false,
        }
    },
    {
        sequelize, // Your Sequelize instance
        tableName: 'fares', // Table name in the database
        timestamps: true, // Automatically manages createdAt and updatedAt
    }
);

// Define associations
Fare.associate = () => {
    Fare.belongsTo(Vehicle, {
        foreignKey: 'vehicleId',
        as: 'Vehicles',
    });
};

// Function to calculate the distance between two locations (using Haversine Formula)
export const calculateDistance = (
    pickupLat: number,
    pickupLong: number,
    dropLat: number,
    dropLong: number
): number => {
    const toRad = (value: number) => (value * Math.PI) / 180;

    const earthRadiusKm = 6371; // Earth's radius in kilometers
    const dLat = toRad(dropLat - pickupLat);
    const dLong = toRad(dropLong - pickupLong);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(pickupLat)) *
        Math.cos(toRad(dropLat)) *
        Math.sin(dLong / 2) *
        Math.sin(dLong / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadiusKm * c; // Returns the distance in kilometers
};

export default Fare;
