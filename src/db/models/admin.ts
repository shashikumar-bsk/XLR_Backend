// models/admin.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelizeConnection from '../config';

interface AdminAttributes {
    admin_id: number;
    admin_name: string;
    email: string;
    password: string;
    mobile_number: string;
    otp_session_id?: string | null;
    otp_timestamp?: Date | null;
    admin_image?: string | null; // New field for admin image URL
    fcm_token?: string | null; // New field for FCM token
    createdAt?: Date;
    updatedAt?: Date;
}

export interface AdminInput extends Optional<AdminAttributes, 'admin_id'> {}
export interface AdminOutput extends Required<AdminAttributes> {}

class Admin extends Model<AdminAttributes, AdminInput> implements AdminAttributes {
    public admin_id!: number;
    public admin_name!: string;
    public email!: string;
    public password!: string;
    public mobile_number!: string;
    public otp_session_id!: string | null;
    public otp_timestamp!: Date | null;
    public admin_image!: string | null; // New field for admin image URL
    public fcm_token!: string | null; // New field for FCM token
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Admin.init({
    admin_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    admin_name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    mobile_number: {
        type: DataTypes.STRING(15),
        allowNull: false,
        unique: true
    },
    otp_session_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null
    },
    otp_timestamp: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
    },
    admin_image: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null
    },
    fcm_token: { // New field for FCM token
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null
    }
}, {
    timestamps: true,
    sequelize: sequelizeConnection,
    tableName: 'admin_tbl'
});

export default Admin;
