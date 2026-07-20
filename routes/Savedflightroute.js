import { Router } from 'express'
import requireAuth from '../middleware/requireAuth.js'
import { listSavedFlights, saveFlight, unsaveFlight } from '../controller/savedflightcontroller.js'

const router = Router()

router.get('/', requireAuth, listSavedFlights)
router.post('/', requireAuth, saveFlight)
router.delete('/:offerId', requireAuth, unsaveFlight)

export default router