import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config'; // Adjust the path as needed
import Driver from './driver'; // Adjust the path to the driver model
import RideRequest from './riderequest'; // Adjust the path to the rideRequest model

// Define attributes for the DriverTransaction model
interface DriverTransactionAttributes {
    transaction_id: number;
    driver_id: number;
    request_id?: number; // Optional foreign key for ride request
    wallet_balance_before: number;
    wallet_balance_after: number;
    amount: number;
    transaction_type: string; // TypeScript type constraint
    description?: string;
    transaction_date: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface DriverTransactionInput extends Optional<DriverTransactionAttributes, 'transaction_id'> {}
export interface DriverTransactionOutput extends Required<DriverTransactionAttributes> {}

// Define the DriverTransaction model
class DriverTransaction extends Model<DriverTransactionAttributes, DriverTransactionInput> implements DriverTransactionAttributes {
    public transaction_id!: number;
    public driver_id!: number;
    public request_id?: number; // Optional foreign key
    public wallet_balance_before!: number;
    public wallet_balance_after!: number;
    public amount!: number;
    public transaction_type!: string; // TypeScript type constraint
    public description?: string;
  
    public transaction_date!: Date;

    // Timestamps
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

// Initialize the model
DriverTransaction.init(
    {
        transaction_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        driver_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: Driver, // Make sure the table name is correct
                key: 'driver_id'
            }
        },
        request_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: RideRequest, // Make sure the table name is correct
                key: 'request_id'
            }
        },
        wallet_balance_before: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        wallet_balance_after: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        amount: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        transaction_type: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isIn: [['credit', 'debit']],
            }
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true,
        },
       
        
        transaction_date: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        }
    },
    {
        sequelize,
        tableName: 'driverTransactions',
        timestamps: true,
    }
);

export default DriverTransaction;
