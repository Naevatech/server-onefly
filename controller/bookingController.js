import { getAuth } from '@clerk/express';

export async function getUserBookings(req, res) {
  res.json({  working: true })
}

export async function createBooking(req, res) {
  const { userId } = getAuth(req)
  const { offerId, passengers } = req.body
  res.status(201).json({ userId, offerId, passengers, status: 'pending' })
}