// models/serviceType.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelizeConnection from '../config';

interface ServiceTypeAttributes {
    service_id: number;
    service_name: string;
}

export interface ServiceTypeInput extends Optional<ServiceTypeAttributes, 'service_id'> {}
export interface ServiceTypeOutput extends Required<ServiceTypeAttributes> {}

class ServiceType extends Model<ServiceTypeAttributes, ServiceTypeInput> implements ServiceTypeAttributes {
    public service_id!: number;
    public service_name!: string;
}

ServiceType.init({
    service_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    service_name: {
        type: DataTypes.STRING(100),
        allowNull: false
    }
}, {
    sequelize: sequelizeConnection,
    tableName: 'service_type',
});

export default ServiceType;
