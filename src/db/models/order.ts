import { Model, DataTypes, Optional } from 'sequelize';
import sequelizeConnection from '../config'; // Adjust the path as necessary
import User from './users';// Adjust the path to the User model as necessary

// Define the attributes for the Order model
export interface OrderAttributes {
  order_id: number;
  user_id: number;
  total_price: number;
//   tax_amount: number;
//   discount_amount: number;
//   final_price: number;
  order_status: 'pending' | 'completed' | 'cancelled';
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the creation attributes for the Order model, making 'order_id' optional
export interface OrderCreationAttributes extends Optional<OrderAttributes, 'order_id' | 'createdAt' | 'updatedAt'> {}

// Define the Order class
class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
  public order_id!: number;
  public user_id!: number;
  public total_price!: number;
//   public tax_amount!: number;
//   public discount_amount!: number;
//   public final_price!: number;
  public order_status!: 'pending' | 'completed' | 'cancelled';

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
      model: User, // 'users' would also work
      key: 'id',
    },
   
  },
  total_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
//   tax_amount: {
//     type: DataTypes.DECIMAL(10, 2),
//     allowNull: false,
//   },
//   discount_amount: {
//     type: DataTypes.DECIMAL(10, 2),
//     allowNull: false,
//   },
//   final_price: {
//     type: DataTypes.DECIMAL(10, 2),
//     allowNull: false,
 // },
  order_status: {
    type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
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


export default Order;


