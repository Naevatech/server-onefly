import { Duffel } from '@duffel/api'

if (!process.env.DUFFEL_ACCESS_TOKEN) {
  throw new Error('Missing DUFFEL_ACCESS_TOKEN — add it to your .env file')
}

const duffel = new Duffel({
  token: process.env.DUFFEL_ACCESS_TOKEN,
})

export default duffel