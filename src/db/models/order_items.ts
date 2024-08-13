// src/db/models/OrderItem.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelizeConnection from '../config'; // Ensure this imports your sequelize instance
import Order from './order';// Ensure the correct path to the Order model
import AddToCart from './add_to_cart'; // Ensure the correct path to the AddToCart model

interface OrderItemAttributes {
  order_item_id: number;
  order_id: number;
  cart_id: number;
  is_deleted: boolean;
  deleted_at?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderItemInput extends Optional<OrderItemAttributes, 'order_item_id' | 'deleted_at'> {}
export interface OrderItemOutput extends Required<OrderItemAttributes> {}

class OrderItem extends Model<OrderItemAttributes, OrderItemInput> implements OrderItemAttributes {
  public order_item_id!: number;
  public order_id!: number;
  public cart_id!: number;
  public is_deleted!: boolean;
  public deleted_at?: Date;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

OrderItem.init({
  order_item_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  order_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Order,
      key: 'order_id'
    },
    allowNull: false
  },
  cart_id: {
    type: DataTypes.INTEGER,
    references: {
      model: AddToCart, // Updated reference
      key: 'cart_id'
    },
    allowNull: false
  },
  is_deleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  sequelize: sequelizeConnection,
  tableName: 'order_items',
  indexes: [
    {
      unique: true,
      name: 'orderItemId_index',
      fields: ['order_item_id']
    }
  ]
});

OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
OrderItem.belongsTo(AddToCart, { foreignKey: 'cart_id', as: 'cart' });

export default OrderItem;
