import { Router } from 'express'
import { getPlaceSuggestions } from '../controller/placeController.js'

const router = Router()

router.get('/suggestions', getPlaceSuggestions)

export default router