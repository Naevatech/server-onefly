import express from "express";
import {
  getUserBookings,
  createBooking
} from '../controller/bookingController.js';

import requireAuth from "../middleware/requireAuth.js";


const bookingRouter = express.Router();
bookingRouter.use(requireAuth);
bookingRouter.get('/bookings', getUserBookings);
bookingRouter.post('/check', createBooking);

export default bookingRouter;