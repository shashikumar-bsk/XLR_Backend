import { DataTypes, Model, Optional } from 'sequelize';
import sequelizeConnection from '../config';
import Order from './order'; // Adjust the import path as needed
import Transaction from './userTransaction';

// Enum for payment status
export enum PaymentStatus {
    InProgress = 1,
    Failed = 2,
    Success = 3,
}

// Function to get payment status label
export function getPaymentStatusLabel(status: PaymentStatus): string {
    switch (status) {
        case PaymentStatus.InProgress:
            return 'InProgress';
        case PaymentStatus.Failed:
            return 'Failed';
        case PaymentStatus.Success:
            return 'Success';
        default:
            return 'Unknown';
    }
}

interface PaymentAttributes {
    payment_id: number;
    order_id: number;
    transaction_id: number;
    payment_status: PaymentStatus;
    created_at?: Date;
    updated_at?: Date;
}

export interface PaymentInput extends Optional<PaymentAttributes, 'payment_id'> {}
export interface PaymentOutput extends Required<PaymentAttributes> {}

class Payment extends Model<PaymentAttributes, PaymentInput> implements PaymentAttributes {
    public payment_id!: number;
    public order_id!: number;
    public transaction_id!: number;
    public payment_status!: PaymentStatus;
    public created_at!: Date;
    public updated_at!: Date;

    // Custom getter for payment_status
    get statusLabel(): string {
        return getPaymentStatusLabel(this.payment_status);
    }
}

Payment.init({
    payment_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Order, // Ensure this matches the model name of your Order model
            key: 'order_id',
        },
    },
    transaction_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        // Add reference to the Transaction model if applicable
        references: {
            model:Transaction, // Ensure this matches the model name of your Transaction model
            key: 'transaction_id',
        },
    },
    payment_status: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            isIn: [[PaymentStatus.InProgress, PaymentStatus.Failed, PaymentStatus.Success]], // Ensure the value is 1, 2, or 3
        },
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, {
    sequelize: sequelizeConnection,
    modelName: 'Payment',
    tableName: 'payments',
    timestamps: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
});

// Define associations
//Payment.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
// Uncomment and adjust if Transaction model is used
// Payment.belongsTo(Transaction, { foreignKey: 'transaction_id', as: 'transaction' });

export default Payment;
