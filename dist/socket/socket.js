"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSocketInstance = exports.initializeSocket = void 0;
const socket_io_1 = require("socket.io");
const rideService_1 = require("../routes/rideService"); // Adjust the path as needed
const driverService_1 = require("../services/driverService");
let io;
const initializeSocket = (server) => {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: '*', // Adjust according to your CORS policy
        },
    });
    io.on('connection', (socket) => {
        console.log('New client connected', socket.id);
        // Handle ride request
        socket.on('ride_request', (data, callback) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                console.log('Ride request received:', data);
                // Fetch available drivers
                const availableDrivers = yield (0, driverService_1.getAvailableDrivers)();
                console.log('Available drivers:', availableDrivers);
                // Emit ride request event to all connected clients
                io.emit('ride_requested', data);
                console.log('Emitting ride_request to all connected clients');
                // Send acknowledgment back to the client
                if (typeof callback === 'function') {
                    callback({ status: 'success', message: 'Ride request processed successfully' });
                }
                else {
                    console.error('Callback function is not provided or invalid');
                }
            }
            catch (error) {
                console.error('Error handling ride request:', error);
                if (typeof callback === 'function') {
                    callback({ status: 'error', message: 'Failed to process ride request' });
                }
                else {
                    console.error('Callback function is not provided or invalid');
                }
            }
        }));
        // Handle ride accepted
        socket.on('ride_accepted', (data) => __awaiter(void 0, void 0, void 0, function* () {
            const { request_id, driver_id } = data;
            console.log('Ride accepted event received:', data);
            try {
                // Use the acceptRide service to handle the acceptance
                const { rideRequest, driver } = yield (0, rideService_1.acceptRide)(request_id, driver_id);
                // Emit ride accepted event to all connected clients
                io.emit('ride_accepted', { rideRequest, driver });
                console.log('Emitting ride_accepted to all connected clients');
            }
            catch (error) {
                console.error('Error handling ride_accepted event:', error);
            }
        }));
        // Handle driver connection
        socket.on('driver_connected', (driverId) => {
            console.log(`Received driver_connected event for driver ${driverId}`);
            // You can keep track of driver connections here if needed
        });
        // Handle user connection
        socket.on('user_connected', (userId) => {
            console.log(`User ${userId} connected with socket ID ${socket.id}`);
        });
        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
            // Handle disconnection logic if needed
        });
        // Other socket event handlers can be defined here
    });
    return io;
};
exports.initializeSocket = initializeSocket;
const getSocketInstance = () => {
    if (!io) {
        throw new Error('Socket.io not initialized. Call initializeSocket first.');
    }
    return io;
};
exports.getSocketInstance = getSocketInstance;
