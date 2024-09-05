import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../config";

interface PromotionAttributes {
    promotion_id: number;
    promotion_name: string;
    description?: string;
    promotion_type: string; // e.g., discount, free delivery, referral bonus
    start_date: Date;
    end_date: Date;
    discount_amount?: number;
    discount_percentage?: number;
    eligibility_criteria?: string;
    usage_limit?: number;
    promotion_code: string;
    associated_campaign?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface PromotionInput extends Optional<PromotionAttributes, 'promotion_id'> {}
export interface PromotionOutput extends Required<PromotionAttributes> {}

class Promotion extends Model<PromotionAttributes, PromotionInput> implements PromotionAttributes {
    public promotion_id!: number;
    public promotion_name!: string;
    public description?: string;
    public promotion_type!: string;
    public start_date!: Date;
    public end_date!: Date;
    public discount_amount?: number;
    public discount_percentage?: number;
    public eligibility_criteria?: string;
    public usage_limit?: number;
    public promotion_code!: string;
    public associated_campaign?: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Promotion.init({
    promotion_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    promotion_name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    },
    promotion_type: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    start_date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    end_date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    discount_amount: {
        type: DataTypes.DECIMAL(10, 2)
    },
    discount_percentage: {
        type: DataTypes.DECIMAL(5, 2)
    },
    eligibility_criteria: {
        type: DataTypes.TEXT
    },
    usage_limit: {
        type: DataTypes.INTEGER
    },
    promotion_code: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    associated_campaign: {
        type: DataTypes.STRING(255)
    }
},{
    timestamps: true,
    sequelize: sequelizeConnection,
    tableName: 'promotions',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    indexes: [
        {
            unique: true,
            name: 'promotionId_index',
            fields: ['promotion_id']
        }
    ]
});

export default Promotion;
