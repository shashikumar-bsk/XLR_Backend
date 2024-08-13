//SubCategoryModel.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelizeConnection from '../config'; // Ensure this imports your sequelize instance
import Category from './Category';
import Image from './image';

interface SubCategoryAttributes {
    sub_category_id: number;
    category_id: number;
    name: string;
    description?: string;
    image_id: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface SubCategoryInput extends Optional<SubCategoryAttributes, 'sub_category_id'> {}
export interface SubCategoryOutput extends Required<SubCategoryAttributes> {}

class SubCategory extends Model<SubCategoryAttributes, SubCategoryInput> implements SubCategoryAttributes {
    public sub_category_id!: number;
    public category_id!: number;
    public name!: string;
    public description!: string;
    public image_id!: number;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

SubCategory.init({
    sub_category_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Category,
            key: 'category_id'
        }
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    image_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Image,
            key: 'image_id'
        }
    }
}, {
    timestamps: true,
    sequelize: sequelizeConnection,
    tableName: 'sub_categories',
    indexes: [
        {
            unique: true,
            name: 'subCategoryId_index',
            fields: ['sub_category_id']
        }
    ]
});
SubCategory.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

SubCategory.belongsTo(Image, { foreignKey: 'image_id', as: 'image' });

export default SubCategory;
