import { getAuth } from '@clerk/express';
import stripe from '../config/stripe.js'
import transporter from '../config/mailer.js'
import Booking from '../model/Booking.js'
import { confirmationEmailHtml } from '../utils/emailTemplates.js'

export async function getUserBookings(req, res) {
  res.json({  working: true })
}

export async function createBooking(req, res) {
  const { userId } = getAuth(req)
  const { offerId, passengers } = req.body
  res.status(201).json({ userId, offerId, passengers, status: 'pending' })
}

// PNR = Passenger Name Record is the booking reference number for a flight reservation generating a 6-character code like AB3XY9)
const PNR_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const generatePnr = () => {
  let pnr = ''
  for (let i = 0; i < 6; i++) pnr += PNR_CHARS[Math.floor(Math.random() * PNR_CHARS.length)]
  return pnr
}

const generateTicketNumber = () => {
  const prefix = String(Math.floor(100 + Math.random() * 900))
  const suffix = String(Math.floor(1000000 + Math.random() * 9000000))
  return `${prefix}-${suffix}`
}

const SEAT_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']
const generateSeat = () => {
  const row = Math.floor(2 + Math.random() * 28)
  const letter = SEAT_LETTERS[Math.floor(Math.random() * SEAT_LETTERS.length)]
  return `${row}${letter}`
}

// POST /api/bookings/confirm
export const confirmBooking = async (req, res) => {
  const { userId } = getAuth(req)
  const { offer, passengers, contact, paymentIntentId } = req.body

  if (!offer || !Array.isArray(passengers) || passengers.length === 0 || !contact?.email) {
    return res.status(400).json({ error: 'offer, passengers, and contact.email are required' })
  }

  if (!paymentIntentId) {
    return res.status(400).json({ error: 'paymentIntentId is required' })
  }

  try {
    // Never trust the client's word alone that payment succeeded — verify
    // directly against Stripe before creating anything.
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    if (paymentIntent.status !== 'succeeded') {
      return res.status(402).json({ error: 'Payment has not succeeded' })
    }

    const pnr = generatePnr()

    const bookedPassengers = passengers.map((p) => ({
      ...p,
      ticketNumber: generateTicketNumber(),
      seats: offer.slices.map(() => generateSeat()),
    }))

    const legs = offer.slices.map((slice) => ({
      origin: slice.origin,
      originCity: slice.originCity,
      destination: slice.destination,
      destinationCity: slice.destinationCity,
      departingAt: slice.departingAt,
      arrivingAt: slice.arrivingAt,
      duration: slice.duration,
      airline: slice.segments?.[0]?.airline ?? null,
      flightNumber: slice.segments?.[0]?.flightNumber ?? null,
    }))

    const booking = await Booking.create({
      userId,
      pnr,
      offerId: offer.id,
      legs,
      passengers: bookedPassengers,
      contactEmail: contact.email,
      contactPhone: contact.phone,
      totalAmount: offer.totalAmount,
      totalCurrency: offer.totalCurrency,
      paymentIntentId,
    })

    // Email is sent best-effort — a flaky SMTP connection shouldn't make an
    // already-paid, already-saved booking look like it failed to the user.
    try {
      await transporter.sendMail({
        from: process.env.SENDER_EMAIL,
        to: contact.email,
        subject: `You're all set, ${bookedPassengers[0].firstName}!`,
        html: confirmationEmailHtml(booking),
      })
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
    }

    res.status(201).json({ booking })
  } catch (error) {
    console.error('Failed to confirm booking:', error)
    res.status(500).json({ error: 'Failed to confirm booking' })
  }
}

// GET /api/bookings/:pnr
export const getBookingByPnr = async (req, res) => {
  const { userId } = getAuth(req)
  const { pnr } = req.params

  try {
    const booking = await Booking.findOne({ pnr, userId })
    if (!booking) return res.status(404).json({ error: 'Booking not found' })
    res.json({ booking })
  } catch (error) {
    console.error('Failed to fetch booking:', error)
    res.status(500).json({ error: 'Failed to fetch booking' })
  }
}