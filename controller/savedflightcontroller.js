import { getAuth } from '@clerk/express'
import SavedFlight from '../model/Savedflight.js'

// GET /api/saved-flights
export const listSavedFlights = async (req, res) => {
  const { userId } = getAuth(req)

  try {
    const savedFlights = await SavedFlight.find({ userId }).sort({ createdAt: -1 })
    res.json({ savedFlights })
  } catch (error) {
    console.error('Failed to list saved flights:', error)
    res.status(500).json({ error: 'Failed to load saved flights' })
  }
}

// POST /api/saved-flights
export const saveFlight = async (req, res) => {
  const { userId } = getAuth(req)
  const { offerId, airline, origin, destination, departingAt, arrivingAt, totalAmount, totalCurrency } =
    req.body

  if (!offerId) {
    return res.status(400).json({ error: 'offerId is required' })
  }
  try {
    // Resaving the same offer update some property of that offer like price
    const saved = await SavedFlight.findOneAndUpdate(
      { userId, offerId },
      { userId, offerId, airline, origin, destination, departingAt, arrivingAt, totalAmount, totalCurrency },
      { upsert: true, new: true },
    )
    res.status(201).json({ savedFlight: saved })
  } catch (error) {
    console.error('Failed to save flight:', error)
    res.status(500).json({ error: 'Failed to save flight' })
  }
}

// DELETE /api/saved-flights/:offerId
export const unsaveFlight = async (req, res) => {
  const { userId } = getAuth(req)
  const { offerId } = req.params

  try {
    await SavedFlight.deleteOne({ userId, offerId })
    res.status(204).send()
  } catch (error) {
    console.error('Failed to unsave flight:', error)
    res.status(500).json({ error: 'Failed to unsave flight' })
  }
}