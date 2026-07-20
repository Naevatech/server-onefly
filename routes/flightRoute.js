import { Router } from 'express'
import { searchFlights, getOffer } from '../controller/flightController.js'

const router = Router()

router.post('/search', searchFlights)
router.get('/:id', getOffer)

export default router