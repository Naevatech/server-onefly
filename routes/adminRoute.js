import { Router } from 'express'
import requireAdmin from '../middleware/requireAdmin.js'
import {
  listAllBookings,
  getOverviewStats,
  getCustomers,
  getFlightsRoutes,
  getPayments,
} from '../controller/adminController.js'

const router = Router()

router.get('/overview', requireAdmin, getOverviewStats)
router.get('/bookings', requireAdmin, listAllBookings)
router.get('/flights-routes', requireAdmin, getFlightsRoutes)
router.get('/customers', requireAdmin, getCustomers)
router.get('/payments', requireAdmin, getPayments)

export default router