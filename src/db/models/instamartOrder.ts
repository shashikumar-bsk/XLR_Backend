import { Model, DataTypes, Optional } from 'sequelize';
import sequelizeConnection from '../config'; // Adjust the path as necessary
import User from './users';
import Address from './Address'; 

// Define the attributes for the InstamartOrder model
export interface InstamartOrderAttributes {
  Instamartorder_id: number;
  user_id: number;
  address_id: number;
  total_price: number; // renamed from totalPayment_price
  Instamartorder_status: 'pending' | 'completed' | 'cancelled';
  payment_method: 'cash_on_delivery' | 'online';
  quantity: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the creation attributes for the InstamartOrder model, making 'Instamartorder_id' optional
export interface InstamartOrderCreationAttributes extends Optional<InstamartOrderAttributes, 'Instamartorder_id' | 'createdAt' | 'updatedAt'> { }

// Define the InstamartOrder class
class InstamartOrder extends Model<InstamartOrderAttributes, InstamartOrderCreationAttributes> implements InstamartOrderAttributes {
  public Instamartorder_id!: number;
  public user_id!: number;
  public address_id!: number;
  public total_price!: number;
  public Instamartorder_status!: 'pending' | 'completed' | 'cancelled';
  public payment_method!: 'cash_on_delivery' | 'online';
  public quantity!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize the InstamartOrder model
InstamartOrder.init({
  Instamartorder_id: {
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
  address_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Address,
      key: 'address_id',
    },
  },
  total_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  Instamartorder_status: {
    type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
    allowNull: false,
  },
  payment_method: {
    type: DataTypes.ENUM('cash_on_delivery', 'online'),
    allowNull: false,
  },

  quantity: {
    type: DataTypes.INTEGER,
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
  tableName: 'Instamartorders',
  timestamps: true,
  underscored: true,
});

// Set up associations
InstamartOrder.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(InstamartOrder, { foreignKey: 'user_id' });
InstamartOrder.belongsTo(Address, { foreignKey: 'address_id' });

export default InstamartOrder;
