import { DataTypes, Model, Optional } from 'sequelize';
import sequelizeConnection from '../config';
import Order from './order';
import Dish from './dish'; // Assuming you have a Dish model

interface OrderItemAttributes {
  order_item_id: number;
  order_id: number;
  dish_id: number;
  quantity: number;
  price: number;
  is_deleted: boolean;
  deleted_at?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderItemInput extends Optional<OrderItemAttributes, 'order_item_id' | 'deleted_at'> { }
export interface OrderItemOutput extends Required<OrderItemAttributes> { }

class OrderItem extends Model<OrderItemAttributes, OrderItemInput> implements OrderItemAttributes {
  public order_item_id!: number;
  public order_id!: number;
  public dish_id!: number;
  public quantity!: number;
  public price!: number;
  public is_deleted!: boolean;
  public deleted_at?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

OrderItem.init({
  order_item_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  order_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Order,
      key: 'order_id',
    },
    allowNull: false,
  },
  dish_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Dish,
      key: 'id', // Assuming 'id' is the primary key in Dish model
    },
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  is_deleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  timestamps: true,
  sequelize: sequelizeConnection,
  tableName: 'order_items',
});

OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
OrderItem.belongsTo(Dish, { foreignKey: 'dish_id', as: 'dish' });

export default OrderItem;
