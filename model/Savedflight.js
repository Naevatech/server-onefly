import mongoose from 'mongoose'
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
    origin: String,
    destination: String,
    departingAt: String,
    arrivingAt: String,
    totalAmount: String,
    totalCurrency: String,
  },
  { timestamps: true },
)

// A user can only save the same offer once
savedFlightSchema.index({ userId: 1, offerId: 1 }, { unique: true })
export default mongoose.model('SavedFlight', savedFlightSchema)