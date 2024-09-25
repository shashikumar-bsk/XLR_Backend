import { Model, DataTypes, Optional } from 'sequelize';
import sequelizeConnection from '../config'; // Adjust the path as necessary
import User from './users'; // Adjust the path to the User model as necessary
import Restaurant from './restaurant'; // Assuming you have a Restaurant model
import Address from './Address'; // Assuming you have an Address model

// Define the attributes for the Order model
export interface OrderAttributes {
  order_id: number;
  user_id: number;
  restaurant_id: number;
  address_id: number;
  total_price: number;
  order_status: 'pending' | 'completed' | 'cancelled';
  payment_method: 'cash_on_delivery' | 'online';
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the creation attributes for the Order model, making 'order_id' optional
export interface OrderCreationAttributes extends Optional<OrderAttributes, 'order_id' | 'createdAt' | 'updatedAt'> { }

// Define the Order class
class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
  public order_id!: number;
  public user_id!: number;
  public restaurant_id!: number;
  public address_id!: number;
  public total_price!: number;
  public order_status!: 'pending' | 'completed' | 'cancelled';
  public payment_method!: 'cash_on_delivery' | 'online';

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize the Order model
Order.init({
  order_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  restaurant_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Restaurant, // Assuming Restaurant model exists
      key: 'id',
    },
  },
  address_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Address, // Assuming Address model exists
      key: 'address_id',
    },
  },
  total_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  order_status: {
    type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
    allowNull: false,
  },
  payment_method: {
    type: DataTypes.ENUM('cash_on_delivery', 'online'),
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize: sequelizeConnection,
  tableName: 'orders',
  timestamps: true,
  underscored: true,
});

Order.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Order, { foreignKey: 'user_id' });
Order.belongsTo(Restaurant, { foreignKey: 'restaurant_id' });
Order.belongsTo(Address, { foreignKey: 'address_id' });

export default Order;
