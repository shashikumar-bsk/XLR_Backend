// models/receiverDetails.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelizeConnection from '../config';
import User from './users';  // Import the User model

interface ReceiverDetailsAttributes {
    receiver_id: number;
    receiver_name: string;
    receiver_phone_number: string;
    user_id: number;  // Add user_id to attributes
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ReceiverDetailsInput extends Optional<ReceiverDetailsAttributes, 'receiver_id'> {}
export interface ReceiverDetailsOutput extends Required<ReceiverDetailsAttributes> {}

class ReceiverDetails extends Model<ReceiverDetailsAttributes, ReceiverDetailsInput> implements ReceiverDetailsAttributes {
    public receiver_id!: number;
    public receiver_name!: string;
    public receiver_phone_number!: string;
    public user_id!: number;  // Add user_id to class properties

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

ReceiverDetails.init({
    receiver_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    receiver_name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    receiver_phone_number: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User, // Name of the target model
            key: 'id'    // Key in the target model that the foreign key refers to
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    }
}, {
    timestamps: true,
    sequelize: sequelizeConnection,
    tableName: 'receiver_details',
    indexes: [
        {
            unique: true,
            name: 'receiverId_index',
            fields: ['receiver_id']
        }
    ]
});

// Set up the association
// ReceiverDetails.belongsTo(User, {
//     foreignKey: 'user_id',
//     as: 'user'
// });

export default ReceiverDetails;
