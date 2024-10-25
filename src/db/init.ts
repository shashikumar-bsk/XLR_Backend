// const isDev = true;
import dotenv from 'dotenv'
dotenv.config();
import { Booking } from './models';
import Admin from './models/admin';
import Driver from './models/driver';
import DriverDocs from './models/driver-documents';
import DriverLocation from './models/driverlocation';
import ReceiverDetails from './models/recieverdetails';
import RideRequest from './models/riderequest';
import ServiceType from './models/servicetype';
import User from './models/users';
import DriverEarnings from './models/driverearnings';
import Restaurant from './models/restaurant';
import Product from './models/product';
import SubCategory from './models/SubCategory';
import SuperCategory from './models/SuperCategory';
import Category from './models/Category';
import brand from './models/brand';
import Image from './models/image';
import inventory from './models/inventory';
import Address from './models/Address';
import UserTransaction from './models/userTransaction';
import AddToCart from './models/add_to_cart';
import DriverTransaction from './models/drivertransaction';
import Vehicle from './models/Vehicles';
import Order from './models/order';
import Payment from './models/payment';
import SenderDetails from './models/sender_details';
import OrderItem from './models/order_items';
import CartItemRest from './models/CartItemRestaurants';
import InstamartOrder from './models/instamartOrder';
import instamartOrderItem from './models/instamartOrderItems';
import dish from './models/dish';
import Fare from './models/Fare'
import vehicleBooking from './models/vehicleBooking';

async function init() {

    const isDev = false

    // Set up associations
    User.hasMany(RideRequest, { foreignKey: 'user_id' });
    Driver.hasMany(RideRequest, { foreignKey: 'driver_id' });
    Booking.hasMany(RideRequest, { foreignKey: 'booking_id' });
    ReceiverDetails.hasMany(RideRequest, { foreignKey: 'receiver_id' })
    ReceiverDetails.hasMany(RideRequest, { foreignKey: 'receiver_id' })

    RideRequest.belongsTo(User, { foreignKey: 'user_id' });
    RideRequest.belongsTo(Driver, { foreignKey: 'driver_id' });
    RideRequest.belongsTo(Booking, { foreignKey: 'booking_id' });
    RideRequest.belongsTo(ReceiverDetails, { foreignKey: 'receiver_id' })
    RideRequest.belongsTo(ReceiverDetails, { foreignKey: 'receiver_id' })



    await User.sync({ alter: isDev });
    await Driver.sync({ alter: isDev });
    await DriverDocs.sync({ alter: isDev });
    await ServiceType.sync({ alter: isDev });
    await ReceiverDetails.sync({ alter: isDev });
    await RideRequest.sync({ alter: isDev });
    await Admin.sync({ alter: isDev });
    await DriverLocation.sync({ alter: isDev });
    await DriverEarnings.sync({ alter: isDev });
    await SubCategory.sync({ alter: isDev });
    await SuperCategory.sync({ alter: isDev });
    await Category.sync({ alter: isDev });
    await Restaurant.sync({alter: isDev});
    await dish.sync({alter: isDev});
    await brand.sync({alter: isDev});
    await inventory.sync({alter: isDev});
    await Product.sync({alter: isDev});
    await Image.sync({alter: isDev});
    await Restaurant.sync({alter: isDev});
    await brand.sync({alter: isDev})
    await Address.sync({alter: isDev});
    await UserTransaction.sync({alter: isDev});
    await AddToCart.sync({alter: isDev});
    await DriverTransaction.sync({alter: isDev});
    await Vehicle.sync({alter: isDev});
    await OrderItem.sync({alter: isDev});
    await Payment.sync({alter: isDev});
    await CartItemRest.sync({alter: isDev});
    await Order.sync({alter: isDev});
    await InstamartOrder.sync({alter: isDev});
    await instamartOrderItem.sync({alter: isDev});
    await Fare.sync({alter: isDev});
    await Booking.sync({alter: isDev});
    await SenderDetails.sync({alter: isDev});
    await vehicleBooking.sync({alter: isDev});

}

const dbInit = () => {
    init();
};

export default dbInit;