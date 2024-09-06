
import { DataTypes, Model, Optional } from 'sequelize';
import sequelizeConnection from '../config'; // Update this path as needed
import User from './users';
import Promotion from './promotions';
import Product from './product';

interface AddToCartAttributes {
    cart_id: number;
    user_id: number;
    product_id: number;
    image_url: string;
    quantity: number;
    price: number;
    total_price: number;
    is_deleted: boolean;
    promotion_id?: number;
    delivery_fee?: number;

    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}

export interface AddToCartInput extends Optional<AddToCartAttributes, 'cart_id'> {}
export interface AddToCartOutput extends Required<AddToCartAttributes> {}

class AddToCart extends Model<AddToCartAttributes, AddToCartInput> implements AddToCartAttributes {
    id(id: any, arg1: { include: { model: typeof Product; as: string; }[]; }) {
        throw new Error('Method not implemented.');
    }
    public cart_id!: number;
    public user_id!: number;
    public product_id!: number;
    public image_url!: string;
    public quantity!: number;
    public price!: number;
    public total_price!: number;
    public is_deleted!: boolean;
    public promotion_id?: number;
    public delivery_fee?: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public deletedAt?: Date;
}

AddToCart.init({
    cart_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    product_id:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Product,
            key: 'product_id'
        }
    },
    image_url: {
        type: DataTypes.STRING,
        allowNull: false
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    total_price: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    promotion_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Promotion,
            key: 'promotion_id'
        }
    },
    // delivery_fee: {
    //     type: DataTypes.FLOAT,
    //     allowNull: true
    // },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    deletedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    timestamps: true,
    paranoid: false,
    sequelize: sequelizeConnection,
    tableName: 'cart_items',


     indexes: [

        {
            unique: false,
            name:  'cart_userId_index',
            fields: ['user_id']
        }
    ]
});

AddToCart.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });




export default AddToCart;
