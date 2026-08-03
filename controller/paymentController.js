import stripe from '../config/stripe.js'

// POST /api/payment/create-intent
export const createPaymentIntent = async (req, res) => {
  const { amount, currency } = req.body

  if (!amount || !currency) {
    return res.status(400).json({ error: 'amount and currency are required' })
  }

  try {
    const amountInSmallestUnit = Math.round(Number(amount) * 100)

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInSmallestUnit,
      currency: currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
    })

    res.json({ clientSecret: paymentIntent.client_secret })
  } catch (error) {
    console.error('Failed to create payment intent:', error)
    res.status(500).json({ error: 'Failed to initialize payment' })
  }
}