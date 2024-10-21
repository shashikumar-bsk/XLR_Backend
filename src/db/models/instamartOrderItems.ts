import { DataTypes, Model, Optional } from 'sequelize';
import sequelizeConnection from '../config'; // Adjust the path to your Sequelize instance
import InstamartOrder from './instamartOrder'; // Import your InstamartOrder model
import AddToCart from './add_to_cart';

interface instamartOrderItemAttributes {
  order_item_id: number;
  Instamartorder_id: number;
  quantity: number;
  price: number;
  is_deleted: boolean;
  deleted_at?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface instamartOrderItemInput extends Optional<instamartOrderItemAttributes, 'order_item_id' | 'deleted_at'> {}
export interface instamartOrderItemOutput extends Required<instamartOrderItemAttributes> {}

class instamartOrderItem extends Model<instamartOrderItemAttributes, instamartOrderItemInput> implements instamartOrderItemAttributes {
  public order_item_id!: number;
  public Instamartorder_id!: number;
  public quantity!: number;
  public price!: number;
  public is_deleted!: boolean;
  public deleted_at?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

instamartOrderItem.init({
  order_item_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  Instamartorder_id: {
    type: DataTypes.INTEGER,
    references: {
      model: InstamartOrder,
      key: 'instamartorder_id',
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
  tableName: 'instamartorder_items', // Name of the table in the database
});

instamartOrderItem.belongsTo(InstamartOrder, { foreignKey: 'instamartorder_id', as: 'order' });

export default instamartOrderItem;
