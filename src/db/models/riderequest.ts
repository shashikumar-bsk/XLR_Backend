// import { DataTypes, Model, Optional } from 'sequelize';
// import sequelizeConnection from '../config';
// import User from './users';
// import Driver from './driver';
// import ServiceType from './servicetype';
// import Booking from './booking';
// import ReceiverDetails from './recieverdetails';

// interface RideRequestAttributes {
//     request_id: number;
//     user_id: number;
//     driver_id: number | null;
//     service_type_id: number;
//     receiver_id: number;
//     booking_id: number;
//     status: string;
//     is_deleted: boolean; 
//     createdAt?: Date;
//     updatedAt?: Date;
// }

// export interface RideRequestInput extends Optional<RideRequestAttributes, 'request_id'> {}
// export interface RideRequestOutput extends Required<RideRequestAttributes> {}

// class RideRequest extends Model<RideRequestAttributes, RideRequestInput> implements RideRequestAttributes {
//     public request_id!: number;
//     public user_id!: number;
//     public driver_id!: number | null;
//     public service_type_id!: number;
//     public receiver_id!: number;
//     public booking_id!: number;
//     public status!: string;
//     public is_deleted!: boolean; // Add this line for soft delete

//     public readonly createdAt!: Date;
//     public readonly updatedAt!: Date;
//   id: any;
// }

// RideRequest.init({
//     request_id: {
//         type: DataTypes.INTEGER,
//         autoIncrement: true,
//         primaryKey: true
//     },
//     user_id: {
//         type: DataTypes.INTEGER,
//         allowNull: false,
//         references: {
//             model: User,
//             key: 'id'
//         }
//     },
//     driver_id: {
//         type: DataTypes.INTEGER,
//         allowNull: true,
//         references: {
//             model: Driver,
//             key: 'driver_id'
//         }
//     },
//     service_type_id: {
//         type: DataTypes.INTEGER,
//         allowNull: false,
//         references: {
//             model: ServiceType,
//             key: 'service_id'
//         }
//     },
//     receiver_id: {
//         type: DataTypes.INTEGER,
//         allowNull: false,
//         references: {
//             model: ReceiverDetails,
//             key: 'receiver_id'
//         }
//     },
//     booking_id: {
//         type: DataTypes.INTEGER,
//         allowNull: false,
//         references: {
//             model: Booking,
//             key: 'booking_id'
//         }
//     },
//     status: {
//         type: DataTypes.STRING(50),
//         allowNull: false
//     },
//     is_deleted: { // Add this line for soft delete
//         type: DataTypes.BOOLEAN,
//         allowNull: false,
//         defaultValue: false
//     }
// }, {
//     timestamps: true,
//     sequelize: sequelizeConnection,
//     tableName: 'ride_request_tbl',
//     indexes: [
//         {
//             unique: true,
//             name: 'requestId_index',
//             fields: ['request_id']
//         },
//         {
//             unique: false,
//             name: 'requestId_index',
//             fields: ['user_id']
//         }
//     ]
// });

// export default RideRequest;


import { DataTypes, Model, Optional } from 'sequelize';
import sequelizeConnection from '../config';
import User from './users';
import Driver from './driver';
import ServiceType from './servicetype';
import Booking from './booking';
import ReceiverDetails from './recieverdetails';

interface RideRequestAttributes {
    request_id: string;
    user_id: number;
    driver_id: number | null;
    service_type_id: number;
    receiver_id: number;
    booking_id: number;
    status: string;
    is_deleted: boolean; // Add this line for soft delete
    createdAt?: Date;
    updatedAt?: Date;
}

export interface RideRequestInput extends Optional<RideRequestAttributes, 'request_id'> {}
export interface RideRequestOutput extends Required<RideRequestAttributes> {}

class RideRequest extends Model<RideRequestAttributes, RideRequestInput> implements RideRequestAttributes {
    public request_id!:string;
    public user_id!: number;
    public driver_id!: number | null;
    public service_type_id!: number;
    public receiver_id!: number;
    public booking_id!: number;
    public status!: string;
    public is_deleted!: boolean; // Add this line for soft delete

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
  id: any;
}

RideRequest.init({
    request_id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: () => 'ride_' + Math.random().toString(36).substr(2, 9),
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    driver_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Driver,
            key: 'driver_id'
        }
    },
    service_type_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: ServiceType,
            key: 'service_id'
        }
    },
    receiver_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: ReceiverDetails,
            key: 'receiver_id'
        }
    },
    booking_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Booking,
            key: 'booking_id'
        }
    },
    status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'pending',
    },
    is_deleted: { // Add this line for soft delete
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    timestamps: true,
    sequelize: sequelizeConnection,
    tableName: 'ride_request_tbl',
    indexes: [
        {
            unique: true,
            name: 'requestId_index',
            fields: ['request_id']
        },
        {
            unique: false,
            name: 'requestId_index',
            fields: ['user_id']
        }
    ]
});

export default RideRequest;

