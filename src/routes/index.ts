import { Router, Request, Response } from "express";
import DriverRouter from "./driver";
import OTPRouter from "./OtpRouter";
import UserRouter from "./user";
import DriverDocsRouter from "./driver-documents";
// import BookingRouter from "./booking";
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
// import dishRouter from "./dish";
import inventoryRouter from "./inventory";
import AddressRouter from "./AddressRoutes";
import transactionRouter from "./userTransactionRoute";
 import cartRouter from "./add_to_cartRoute";
import dishRouter from "./dish";
import driverAuthRouter from "./driverAuthRouter";

const routes = Router();


routes.use('/driver', DriverRouter)
routes.use('/otp', OTPRouter)
routes.use('/user',authMiddleware, UserRouter)
routes.use('/driverdoc', DriverDocsRouter)
routes.use('/booking', bookingRouter)
routes.use('/admin', AdminRouter)
routes.use('/driverotp', DriverOTPRouter)
routes.use('/auth', driverAuthRouter)

routes.use('/reciever',authMiddleware,ReceiverDetailsRouter)
routes.use('/bookings',authMiddleware,bookingRouter)
routes.use('/riderequest',authMiddleware,rideRequestRouter)
routes.use('/driverearinings',driverEarningsRouter)
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


export default routes
