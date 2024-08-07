import User from './users';
import Driver from './driver';
import ServiceType from './servicetype';
import Booking from './booking';
import RideRequest from './riderequest';
import ReceiverDetails from './recieverdetails';

// Set up associations
User.hasMany(RideRequest, { foreignKey: 'user_id' });
Driver.hasMany(RideRequest, { foreignKey: 'driver_id' });
Booking.hasMany(RideRequest, { foreignKey: 'booking_id' });
ReceiverDetails.hasMany(RideRequest, { foreignKey: 'receiver_id'})

RideRequest.belongsTo(User, { foreignKey: 'user_id' });
RideRequest.belongsTo(Driver, { foreignKey: 'driver_id' });
RideRequest.belongsTo(Booking, { foreignKey: 'booking_id' });
RideRequest.belongsTo(ReceiverDetails, { foreignKey: 'receiver_id'})

export {
    User,
    Driver,
    ServiceType,
    Booking,
    RideRequest
};
