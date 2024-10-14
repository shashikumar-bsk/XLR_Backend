// models/vehicleBooking.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelizeConnection from '../config';
import User from './users';
import Vehicle from './Vehicles';

interface vehicleBookingAttributes {
    id: number;
    user_id: number;
    vehicle_id?: number; // Optional vehicle_id
    pickup_address: string;
    dropoff_address: string;
    goods_type: string;
    total_price: number;
    sender_name: string;
    sender_phone: string;
    receiver_name: string;
    receiver_phone: string;
    vehicle_name?: string; // Optional
    vehicle_image?: string; // Optional
    status: 'completed' | 'pending' | 'cancelled' | 'In progress'  
    createdAt?: Date;
    updatedAt?: Date;
}

export interface vehicleBookingInput extends Optional<vehicleBookingAttributes, 'id'> {}
export interface vehicleBookingOutput extends Required<vehicleBookingAttributes> {}

class vehicleBooking extends Model<vehicleBookingAttributes, vehicleBookingInput> implements vehicleBookingAttributes {
    public id!: number;
    public user_id!: number;
    public vehicle_id?: number; // Optional vehicle_id
    public pickup_address!: string;
    public dropoff_address!: string;
    public goods_type!: string;
    public total_price!: number;
    public sender_name!: string;
    public sender_phone!: string;
    public receiver_name!: string;
    public receiver_phone!: string;
    public vehicle_name?: string; // Optional
    public vehicle_image?: string; // Optional
    public status!: 'completed' | 'pending' | 'cancelled';

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

vehicleBooking.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    vehicle_id: {
        type: DataTypes.INTEGER,
        allowNull: true, // Make this field optional
        references: {
            model: Vehicle,
            key: 'id' // Ensure this matches the vehicle model primary key
        }
    },
    pickup_address: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    dropoff_address: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    goods_type: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    total_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    sender_name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    sender_phone: {
        type: DataTypes.STRING(15),
        allowNull: false
    },
    receiver_name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    receiver_phone: {
        type: DataTypes.STRING(15),
        allowNull: false
    },
    vehicle_name: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    vehicle_image: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('completed', 'pending', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending'
    }
}, {
    timestamps: true,
    sequelize: sequelizeConnection,
    tableName: 'vehicleBooking',
});

export default vehicleBooking;
