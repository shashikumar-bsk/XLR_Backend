import { Router, Request, Response } from "express";
import DriverRouter from "./driver";
import OTPRouter from "./OtpRouter";
import UserRouter from "./user";
import DriverDocsRouter from "./driver-documents";
import AdminRouter from "./admin";
import DriverOTPRouter from "./driverOtpRouter";
import ReceiverDetailsRouter from "./recieverRoute";
import bookingRouter from "./BookingRoute";                                                                       
import rideRequestRouter from "./riderrequest";
import driverEarningsRouter from "./driverearnings";
import restaurantRouter from "./restaurant";
import productRouter from "./product";
import authMiddleware from "../middlewares/authenticateToken";
import ImageRouter from "./image";
import CategoryRouter from "./CategoryRouter";
import SubCategoryRouter from "./SubCategoryRouter";
import SuperCategoryRouter from "./SuperCategoryRoutes";
import BrandRouter from "./brand";
import inventoryRouter from "./inventory";
import AddressRouter from "./AddressRoutes";
import transactionRouter from "./userTransactionRoute";
import cartRouter from "./add_to_cartRoute";
import driverTransactionRouter from "./drivertransaction";  
import calculatePricesForAllVehicles from "./VehicleRouter";
import orderRouter from "./order";
import paymentRouter from "./payment";
import dishRouter from "./dish";
import driverAuthRouter from "./driverAuthRouter";
import OrderItemRouter from "./order_items";
import RestaurantCartRouter from "./CartItemForRestaurants"
import UsersRouter from "./userimage";
import firebaseNotification from "./notificationRoutes";
import instamartOrderRouter from "./InstamartOrderRoute";
import InstamartOrderItemRouter from "./instamartitemRoute";
import Farerouter from "./FareRouter";
import SenderDetailsRouter from "./sender_details_route";

import DriversRouter from "./driverimage";

import vehicleBookingRouter from "./vehicleBookingRoute";



const routes = Router();


routes.use('/driver', DriverRouter)
routes.use('/otp', OTPRouter)
routes.use('/user', UserRouter)
routes.use('/driverdoc', DriverDocsRouter)
routes.use('/booking', bookingRouter)
routes.use('/admin', AdminRouter)
routes.use('/driverotp', DriverOTPRouter)
routes.use('/auth', driverAuthRouter)
routes.use('/reciever',authMiddleware,ReceiverDetailsRouter)
routes.use('/bookings',authMiddleware,bookingRouter)
routes.use('/riderequest',authMiddleware,rideRequestRouter)
routes.use('/driverearnings',driverEarningsRouter)
routes.use('/restaurant',restaurantRouter)
routes.use('/product',productRouter)
routes.use('/dish',dishRouter)
routes.use('/category',CategoryRouter)
routes.use('/subcategory', SubCategoryRouter)
routes.use('/supercategory', SuperCategoryRouter)
routes.use('/brand',BrandRouter)
routes.use('/image',ImageRouter)
routes.use('/inventory',inventoryRouter)
routes.use('/images', ImageRouter)
routes.use('/addresses', AddressRouter)
routes.use('/transactions', transactionRouter)
routes.use('/cart', cartRouter)
routes.use('/drivertransactions',driverTransactionRouter)
routes.use('/order',orderRouter)
routes.use('/orderitems',OrderItemRouter)
routes.use('/RestaurantCart',RestaurantCartRouter)
routes.use('/payments',paymentRouter)
routes.use('/userimage',UsersRouter)
routes.use('/firebase',firebaseNotification)
routes.use('/instamart-order',instamartOrderRouter)
routes.use('/instamart-item',InstamartOrderItemRouter)
routes.use('/fare',Farerouter)
routes.use('/sender-details',SenderDetailsRouter)
routes.use('/vehicle-type',calculatePricesForAllVehicles)

routes.use('/driverimage',DriversRouter)

routes.use('/vehicle-booking',vehicleBookingRouter)


export default routes;
