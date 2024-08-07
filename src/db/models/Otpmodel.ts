import { DataTypes, Model, Optional } from 'sequelize';
import sequelizeConnection from '../config';

interface OTPAttributes {
  phone: string;
  otp: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OTPInput extends Optional<OTPAttributes, 'phone'> {}
export interface OTPOutput extends Required<OTPAttributes> {}

class OTP extends Model<OTPAttributes, OTPInput> implements OTPAttributes {
  public phone!: string;
  public otp!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

OTP.init(
  {
    phone: {
      type: DataTypes.STRING(15),
      primaryKey: true,
    },
    otp: {
      type: DataTypes.STRING(6),
      allowNull: false,
    },
  },
  {
    timestamps: true,
    sequelize: sequelizeConnection,
    tableName: 'otps',
  }
);

export default OTP;
