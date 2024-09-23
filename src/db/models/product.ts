// productModel.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelizeConnection from '../config'; // Adjust the path to your sequelize instance
import SubCategory from './SubCategory';
import Brand from './brand';
import Image from './image';

interface ProductAttributes {
    product_id: number;
    sub_category_id: number;
    brand_id: number;
    image_id: number;
    name: string;
    description?: string;
    quantity: string;
    total_quantity: number; // New column
    price: number;
    discount_price: number;
    is_available: boolean;
    warehouse_location: string; // New column
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ProductInput extends Optional<ProductAttributes, 'product_id'> {}
export interface ProductOutput extends Required<ProductAttributes> {}

class Product extends Model<ProductAttributes, ProductInput> implements ProductAttributes {
    public product_id!: number;
    public sub_category_id!: number;
    public brand_id!: number;
    public image_id!: number;
    public name!: string;
    public description?: string;
    public quantity!: string;
    public total_quantity!: number; // New column
    public price!: number;
    public discount_price!: number;
    public is_available!: boolean;
    public warehouse_location!: string; // New column

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Product.init({
    product_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    sub_category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: SubCategory,
            key: 'sub_category_id'
        }
    },
    brand_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Brand,
            key: 'brand_id'
        }
    },
    image_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Image,
            key: 'image_id'
        }
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    quantity: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    total_quantity: { // New column
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    discount_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    is_available: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
    },
    warehouse_location: { // New column
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    sequelize: sequelizeConnection,
    modelName: 'Product',
    tableName: 'products',
    timestamps: true,
    indexes: [
        {
            unique: true,
            name: 'productId_index',
            fields: ['product_id']
        }
    ]
});

Product.belongsTo(SubCategory, { foreignKey: 'sub_category_id', as: 'subCategory' });
Product.belongsTo(Brand, { foreignKey: 'brand_id', as: 'brand' });
Product.belongsTo(Image, { foreignKey: 'image_id', as: 'image' });

export default Product;
