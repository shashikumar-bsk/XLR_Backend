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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const driver_1 = __importDefault(require("../db/models/driver"));
// import OTP from '../db/models/Otpmodel';
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const DriverOTPRouter = express_1.default.Router();
const api_key = process.env.API_KEY;
// Generate and send OTP
DriverOTPRouter.post('/send-otp', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { phone } = req.body;
    console.log(phone, req.body);
    if (!phone) {
        return res.status(400).json({ error: 'Phone number is required' });
    }
    try {
        // Check if the driver exists and is active
        // const driver = await Driver.findOne({ where: { phone, is_deleted: false } });
        // console.log(driver)
        // if (!driver) {
        //   return res.status(404).json({ error: 'Driver not found or inactive' });
        // }
        // Send OTP using 2Factor.in API
        const response = yield axios_1.default.get(`https://2factor.in/API/V1/${api_key}/SMS/${phone}/AUTOGEN3/OTP1`);
        if (response.data.Status === 'Success') {
            res.json({ message: 'OTP sent successfully' });
        }
        else {
            throw new Error('Failed to send OTP');
        }
    }
    catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
}));
// Verify OTP
DriverOTPRouter.post('/verify-otp', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
        return res.status(400).json({ error: 'Phone number and OTP are required' });
    }
    try {
        const response = yield axios_1.default.get(`https://2factor.in/API/V1/${api_key}/SMS/VERIFY3/${phone}/${otp}`);
        if (response.data.Status === 'Success') {
            res.json({ message: 'OTP Verified Successfully!' });
        }
        else {
            res.status(400).json({ message: 'Invalid OTP' });
        }
    }
    catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ error: 'Failed to verify OTP' });
    }
}));
// Fetch driver details by phone number
DriverOTPRouter.get('/check-driver', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const phone = req.query.phone; // Ensure phoneNumber is treated as a string
    if (!phone) {
        return res.status(400).json({ error: 'Phone number is required' });
    }
    try {
        const driver = yield driver_1.default.findOne({ where: { phone: phone, is_deleted: false } });
        if (!driver) {
            return res.status(404).json({ error: 'Driver not found or inactive' });
        }
        res.json(driver);
    }
    catch (error) {
        console.error('Error fetching driver details:', error);
        res.status(500).json({ error: 'Failed to fetch driver details' });
    }
}));
exports.default = DriverOTPRouter;
