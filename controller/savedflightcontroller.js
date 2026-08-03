import { getAuth } from '@clerk/express'
import SavedFlight from '../model/SavedFlight.js'

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
  const { offerId, airline, legs, totalAmount, totalCurrency } = req.body

  if (!offerId) {
    return res.status(400).json({ error: 'offerId is required' })
  }

  if (!Array.isArray(legs) || legs.length === 0) {
    return res.status(400).json({ error: 'legs is required and must be a non-empty array' })
  }

  try {
    // Re-saving the same offer doesn't throw a duplicate-key
    const saved = await SavedFlight.findOneAndUpdate(
      { userId, offerId },
      { userId, offerId, airline, legs, totalAmount, totalCurrency },
      { upsert: true, new: true, runValidators: true },
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