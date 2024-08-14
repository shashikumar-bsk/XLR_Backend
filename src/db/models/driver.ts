import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../config";

interface DriverAttributes {
    driver_id: number;
    driver_name: string;
    email: string;
    password: string;
    gender?: string;
    dob?: Date;
    vehicle_type?: string;
    // status:boolean
    vehicle_number: string;
    phone: string;
    active: boolean;
    is_deleted: boolean;
    status: string;  // Updated to string type
    createdAt?: Date;
    updatedAt?: Date;
}

export interface DriverInput extends Optional<DriverAttributes, 'driver_id'> {}
export interface DriverOutput extends Required<DriverAttributes> {}

class Driver extends Model<DriverAttributes, DriverInput> implements DriverAttributes {
    public driver_id!: number;
    public driver_name!: string;
    public email!: string;
    public password!: string;
    public gender!: string;
    public dob!: Date;
    public vehicle_type!: string;
    public vehicle_number!: string;
    public phone!: string;
    public active!: boolean;
    public is_deleted!: boolean;

    public status!: string;  // Updated to string


    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  name: any;
  id: any;
}

Driver.init({
    driver_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    driver_name: {
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
    gender: {
        type: DataTypes.STRING(1)
    },
    dob: {
        type: DataTypes.DATE
    },
    vehicle_type: {
        type: DataTypes.STRING(50)
    },
    vehicle_number: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    phone: {
        type: DataTypes.STRING(15),
        allowNull: false,
        unique: true
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false

    },
    status: {
        type: DataTypes.STRING, // Change to string type
     
    }
},{
    timestamps: true,
    sequelize: sequelizeConnection,
    tableName: 'driver_tbl',
    indexes: [
        {
            unique: true,
            name: 'driverId_index',
            fields: ['driver_id']
        }
    ]
});

export default Driver;
