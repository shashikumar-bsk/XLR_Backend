import { DataTypes, Model, Optional } from 'sequelize';
import sequelizeConnection from '../config'; // Adjust the path to your sequelize instance

// Define the interface for the Brand attributes
interface BrandAttributes {
    brand_id: number;
    name: string;
    description?: string;
    image_id?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

// Define the interface for creating new Brand instances
export interface BrandInput extends Optional<BrandAttributes, 'brand_id'> {}

export interface BrandOutput extends Required<BrandAttributes> {}

// Extend the Model class from Sequelize to create a Brand model
class Brand extends Model<BrandAttributes, BrandInput> implements BrandAttributes {
    public brand_id!: number;
    public name!: string;
    public description?: string;
    public image_id?: number;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

// Initialize the Brand model
Brand.init({
    brand_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true, // Assuming you want the ID to auto-increment
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    image_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'images', // Make sure the table name is correct
            key: 'image_id'
        }
    },
}, {
    sequelize: sequelizeConnection,
    modelName: 'Brand',
    tableName: 'brands',
    timestamps: true,
    indexes: [
        {
            unique: true,
            name: 'brandId_index',
            fields: ['brand_id']
        }
    ]
});

// Export the Brand model
export default Brand;
