// server/model/Booking.js
import mongoose from 'mongoose'

const legSchema = new mongoose.Schema(
  {
    origin: String,
    originCity: String,
    destination: String,
    destinationCity: String,
    departingAt: String,
    arrivingAt: String,
    duration: String,
    airline: String,
    flightNumber: String,
  },
  { _id: false },
)

const passengerSchema = new mongoose.Schema(
  {
    title: String,
    firstName: String,
    lastName: String,
    dateOfBirth: String,
    nationality: String,
    passportNumber: String,
    ticketNumber: String,
    seats: [String],
  },
  { _id: false },
)

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    pnr: {
      type: String,
      required: true,
      unique: true,
    },
    offerId: String,
    legs: [legSchema],
    passengers: [passengerSchema],
    contactEmail: String,
    contactPhone: String,
    totalAmount: String,
    totalCurrency: String,
    paymentIntentId: String,
    status: {
      type: String,
      enum: ['confirmed', 'cancelled'],
      default: 'confirmed',
    },
  },
  { timestamps: true },
)

export default mongoose.model('Booking', bookingSchema)