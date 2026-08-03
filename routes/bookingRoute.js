import express from "express";
import {
  getUserBookings,
  createBooking,
  confirmBooking,
  getBookingByPnr
} from '../controller/bookingController.js';

import requireAuth from "../middleware/requireAuth.js";


const bookingRouter = express.Router();
bookingRouter.use(requireAuth);
bookingRouter.get('/bookings', getUserBookings);
bookingRouter.post('/check', createBooking);
bookingRouter.post('/confirm', confirmBooking);
bookingRouter.get('/:pnr', getBookingByPnr);


export default bookingRouter;