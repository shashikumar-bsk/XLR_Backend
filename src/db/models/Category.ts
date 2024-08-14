import { DataTypes, Model, Optional } from 'sequelize';
import sequelizeConnection from '../config'; // Ensure this imports your sequelize instance
import SuperCategory from './SuperCategory'; // Ensure the correct path to the SuperCategory model
import Image from './image';

interface CategoryAttributes {
    category_id: number;
    super_category_id: number;
    name: string;
    description?: string;
    image_id: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CategoryInput extends Optional<CategoryAttributes, 'category_id'> {}
export interface CategoryOutput extends Required<CategoryAttributes> {}

class Category extends Model<CategoryAttributes, CategoryInput> implements CategoryAttributes {
    public category_id!: number;
    public super_category_id!: number;
    public name!: string;
    public description?: string;
    public image_id!: number;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Category.init({
    category_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    super_category_id: {
        type: DataTypes.INTEGER,
        references: {
            model: SuperCategory,
            key: 'super_category_id'
        },
        allowNull: false
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
        references: {
            model: Image,
            key: 'image_id'
        },
        allowNull: true
    }
}, {
    timestamps: true,
    sequelize: sequelizeConnection,
    tableName: 'categories',
    indexes: [
        {
            unique: true,
            name: 'categoryId_index',
            fields: ['category_id']
        }
    ]
});
Category.belongsTo(SuperCategory, { foreignKey: 'super_category_id', as: 'superCategory' });
Category.belongsTo(Image, { foreignKey: 'image_id', as: 'image' });

export default Category;
