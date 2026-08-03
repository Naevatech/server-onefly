import mongoose from 'mongoose'

// A one-way save has legs.length === 1 and  Round trip has legs.length === 2
const legSchema = new mongoose.Schema(
  {
    origin: String,
    originCity: String,
    destination: String,
    destinationCity: String,
    departingAt: String,
    arrivingAt: String,
  },
  { _id: false },
)

//user saved offer
const savedFlightSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    offerId: {
      type: String,
      required: true,
    },
    airline: String,
    legs: {
      type: [legSchema],
      required: true,
      validate: {
        validator: (legs) => Array.isArray(legs) && legs.length > 0,
        message: 'legs must contain at least one leg',
      },
    },
    totalAmount: String,
    totalCurrency: String,
  },
  { timestamps: true },
)

// A user can only save the same offer once — re-clicking the heart on an
// already-saved flight should unsave it (handled in the controller), not
// create a duplicate row.
savedFlightSchema.index({ userId: 1, offerId: 1 }, { unique: true })

export default mongoose.model('SavedFlight', savedFlightSchema)