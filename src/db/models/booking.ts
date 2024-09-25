// models/booking.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelizeConnection from '../config';
import User from './users';
import ServiceType from './servicetype'; // Import the ServiceType model

interface BookingAttributes {
    booking_id: number;
    user_id: number;
    service_id: number; // Add service_id attribute
    pickup_address: string;
    dropoff_address: string;
    goods_type: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface BookingInput extends Optional<BookingAttributes, 'booking_id'> {}
export interface BookingOutput extends Required<BookingAttributes> {}

class Booking extends Model<BookingAttributes, BookingInput> implements BookingAttributes {
    public booking_id!: number;
    public user_id!: number;
    public service_id!: number; // Add service_id property
    public pickup_address!: string;
    public dropoff_address!: string;
    public goods_type!: string; // Add goods_type attribute

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Booking.init({
    booking_id: {
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
    service_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: ServiceType,
            key: 'service_id'
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
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    timestamps: true,
    sequelize: sequelizeConnection,
    tableName: 'booking',
    indexes: [
        {
            unique: true,
            name: 'BookingId_index',
            fields: ['booking_id']
        }
    ]
});

export default Booking;
