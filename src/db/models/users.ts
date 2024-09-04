// models/user.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelizeConnection from '../config';

interface UserAttributes {
    id: number;
    username: string;
    email: string;
    password: string;
    gender?: string;
    phone: string;
    profile_image?: string;  // Add profile_image attribute
    active: boolean;
    is_deleted: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface UserInput extends Optional<UserAttributes, 'id'> {}
export interface UserOutput extends Required<UserAttributes> {}

class User extends Model<UserAttributes, UserInput> implements UserAttributes {
    public id!: number;
    public username!: string;
    public email!: string;
    public password!: string;
    public gender!: string;
    public phone!: string;
    public profile_image!: string;  // Add profile_image attribute
    public active!: boolean;
    public is_deleted!: boolean;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

User.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    username: {
        type: DataTypes.STRING(50),
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
    gender: {
        type: DataTypes.STRING(1)
    },
    phone: {
        type: DataTypes.STRING(15), // Define phone attribute
        allowNull: false,
        unique: true,
    },
    profile_image: {
        type: DataTypes.STRING(255), // Define profile_image attribute
        allowNull: true,
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    timestamps: true,
    sequelize: sequelizeConnection,
    tableName: 'User_tbl',
    indexes: [
        {
            unique: true,
            name: 'userId_index',
            fields: ['id']
        }
    ]
});

export default User;
