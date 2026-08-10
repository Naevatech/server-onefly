// server/controller/adminController.js
import Booking from '../model/Booking.js'
import stripe from '../config/stripe.js'

// GET /api/admin/bookings
export const listAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 }).limit(200)
    res.json({ bookings })
  } catch (error) {
    console.error('Failed to list bookings:', error)
    res.status(500).json({ error: 'Failed to load bookings' })
  }
}

// GET /api/admin/overview
export const getOverviewStats = async (req, res) => {
  try {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const prevThirtyStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    const [current, prior] = await Promise.all([
      Booking.find({ createdAt: { $gte: thirtyDaysAgo } }),
      Booking.find({ createdAt: { $gte: prevThirtyStart, $lt: thirtyDaysAgo } }),
    ])

    const sumAmount = (list) => list.reduce((acc, b) => acc + Number(b.totalAmount || 0), 0)
    const cancelledCount = (list) => list.filter((b) => b.status === 'cancelled').length

    const totalRevenue = sumAmount(current)
    const bookingsCount = current.length
    const avgOrderValue = bookingsCount ? totalRevenue / bookingsCount : 0
    const cancellationRate = bookingsCount ? (cancelledCount(current) / bookingsCount) * 100 : 0

    const priorRevenue = sumAmount(prior)
    const priorBookingsCount = prior.length
    const priorAvgOrderValue = priorBookingsCount ? priorRevenue / priorBookingsCount : 0
    const priorCancellationRate = priorBookingsCount
      ? (cancelledCount(prior) / priorBookingsCount) * 100
      : 0

    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const revenueByDay = {}
    for (const b of current) {
      const created = new Date(b.createdAt)
      if (created < sevenDaysAgo) continue
      const day = created.toISOString().slice(0, 10)
      revenueByDay[day] = (revenueByDay[day] || 0) + Number(b.totalAmount || 0)
    }
    const revenueLast7Days = Object.entries(revenueByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({ date, revenue }))

    const routeCounts = {}
    for (const b of current) {
      if (!b.legs?.length) continue
      const route = `${b.legs[0].origin} → ${b.legs[b.legs.length - 1].destination}`
      routeCounts[route] = (routeCounts[route] || 0) + 1
    }
    const topRoutes = Object.entries(routeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([route, bookings]) => ({ route, bookings }))

    res.json({
      totalRevenue,
      bookingsCount,
      avgOrderValue,
      cancellationRate,
      revenueDeltaPct: priorRevenue ? ((totalRevenue - priorRevenue) / priorRevenue) * 100 : null,
      bookingsDelta: bookingsCount - priorBookingsCount,
      avgOrderValueDeltaPct: priorAvgOrderValue
        ? ((avgOrderValue - priorAvgOrderValue) / priorAvgOrderValue) * 100
        : null,
      cancellationRateDeltaPts: cancellationRate - priorCancellationRate,
      revenueLast7Days,
      topRoutes,
    })
  } catch (error) {
    console.error('Failed to load overview stats:', error)
    res.status(500).json({ error: 'Failed to load overview stats' })
  }
}

// GET /api/admin/customers
export const getCustomers = async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 })
    const byEmail = new Map()

    for (const b of bookings) {
      const email = b.contactEmail
      if (!email) continue
      const lead = b.passengers?.[0]
      const name = lead ? `${lead.firstName} ${lead.lastName}` : email

      const existing = byEmail.get(email) || {
        name,
        email,
        bookings: 0,
        totalSpent: 0,
        lastBooking: b.createdAt,
      }
      existing.bookings += 1
      existing.totalSpent += Number(b.totalAmount || 0)
      if (new Date(b.createdAt) > new Date(existing.lastBooking)) {
        existing.lastBooking = b.createdAt
      }
      byEmail.set(email, existing)
    }

    const customers = Array.from(byEmail.values())
      .map((c) => ({
        ...c,
        tier: c.bookings === 1 ? 'New' : c.totalSpent >= 5000 || c.bookings >= 6 ? 'VIP' : 'Active',
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)

    res.json({ customers })
  } catch (error) {
    console.error('Failed to load customers:', error)
    res.status(500).json({ error: 'Failed to load customers' })
  }
}

// GET /api/admin/flights-routes
export const getFlightsRoutes = async (req, res) => {
  try {
    const bookings = await Booking.find()
    const byRoute = new Map()

    for (const b of bookings) {
      if (!b.legs?.length) continue
      const leg = b.legs[0]
      const key = `${leg.origin}→${leg.destination}→${leg.airline}`
      const existing = byRoute.get(key) || {
        route: `${leg.origin} → ${leg.destination}`,
        airline: leg.airline || 'Unknown',
        flights: 0,
        revenue: 0,
      }
      existing.flights += 1
      existing.revenue += Number(b.totalAmount || 0)
      byRoute.set(key, existing)
    }

    const routes = Array.from(byRoute.values()).sort((a, b) => b.revenue - a.revenue)
    res.json({ routes })
  } catch (error) {
    console.error('Failed to load flights & routes:', error)
    res.status(500).json({ error: 'Failed to load flights & routes' })
  }
}

// GET /api/admin/payments
export const getPayments = async (req, res) => {
  try {
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 20,
      expand: ['data.payment_method'],
    })

    const intentIds = paymentIntents.data.map((pi) => pi.id)
    const bookings = await Booking.find({ paymentIntentId: { $in: intentIds } })
    const bookingByIntent = new Map(bookings.map((b) => [b.paymentIntentId, b]))

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    let processed = 0
    let refunded = 0
    let failedCount = 0

    const transactions = paymentIntents.data.map((pi) => {
      const booking = bookingByIntent.get(pi.id)
      const card = typeof pi.payment_method === 'object' ? pi.payment_method?.card : null
      const amount = pi.amount / 100
      const createdAt = new Date(pi.created * 1000)

      let status = 'Paid'
      if (pi.status === 'succeeded' && pi.amount_received === 0) status = 'Refunded'
      else if (pi.status !== 'succeeded') status = 'Failed'

      if (createdAt >= thirtyDaysAgo) {
        if (status === 'Paid') processed += amount
        if (status === 'Refunded') refunded += amount
        if (status === 'Failed') failedCount += 1
      }

      return {
        transactionId: pi.id,
        pnr: booking?.pnr ?? '—',
        method: card ? `${card.brand} •••• ${card.last4}` : 'Unknown',
        date: createdAt.toISOString(),
        amount,
        currency: pi.currency,
        status,
      }
    })

    res.json({ transactions, processed, refunded, failedCount })
  } catch (error) {
    console.error('Failed to load payments:', error)
    res.status(500).json({ error: 'Failed to load payments' })
  }
}