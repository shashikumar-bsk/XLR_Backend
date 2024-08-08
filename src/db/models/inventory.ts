import { DataTypes, Model, Optional } from 'sequelize';
import sequelizeConnection from '../config'; // Adjust the path to your sequelize instance
import Product from './product'; // Adjust the path to your Product model

interface InventoryAttributes {
    inventory_id: number;
    product_id: number;
    quantity: number;
    warehouse_location: string;
    restock_date: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface InventoryInput extends Optional<InventoryAttributes, 'inventory_id'> {}
export interface InventoryOutput extends Required<InventoryAttributes> {}

class Inventory extends Model<InventoryAttributes, InventoryInput> implements InventoryAttributes {
    public inventory_id!: number;
    public product_id!: number;
    public quantity!: number;
    public warehouse_location!: string;
    public restock_date!: Date;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Inventory.init({
    inventory_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'products', // Name of the products table
            key: 'product_id'
        }
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    warehouse_location: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    restock_date: {
        type: DataTypes.DATE,
        allowNull: false,
    },
}, {
    sequelize: sequelizeConnection,
    modelName: 'Inventory',
    tableName: 'inventories',
    timestamps: true,
    indexes: [
        {
            unique: true,
            name: 'inventoryId_index',
            fields: ['inventory_id']
        },
        {
            unique: false,
            name: 'inventoryId_index',
            fields: ['product_id']
        }
    ]
});
Inventory.belongsTo(Product, { foreignKey: 'product_id' });

export default Inventory;