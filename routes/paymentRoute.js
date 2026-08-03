import { Router } from 'express'
import { createPaymentIntent } from '../controller/paymentController.js'

const router = Router()

router.post('/create-intent', createPaymentIntent)

export default router