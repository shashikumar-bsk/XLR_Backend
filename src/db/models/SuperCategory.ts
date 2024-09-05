import { DataTypes, Model, Optional } from 'sequelize';
import sequelizeConnection from '../config'; // Ensure this imports your sequelize instance


interface SuperCategoryAttributes {
    super_category_id: number;
    name: string;
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface SuperCategoryInput extends Optional<SuperCategoryAttributes, 'super_category_id'> {}
export interface SuperCategoryOutput extends Required<SuperCategoryAttributes> {}

class SuperCategory extends Model<SuperCategoryAttributes, SuperCategoryInput> implements SuperCategoryAttributes {
    public super_category_id!: number;
    public name!: string;
    public description?: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

SuperCategory.init({
    super_category_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    timestamps: true,
    sequelize: sequelizeConnection,
    tableName: 'super_categories',
    indexes: [
        {
            unique: true,
            name: 'superCategoryId_index',
            fields: ['super_category_id']
        }
    ]
});


export default SuperCategory;
