import duffel from '../config/duffel.js'

// GET /api/flights/:id
export const getOffer = async (req, res) => {
  const { id } = req.params

  try {
    const offerResponse = await duffel.offers.get(id)
    const offer = offerResponse.data

    const slices = offer.slices.map((slice) => {
      const firstSegment = slice.segments[0]
      const lastSegment = slice.segments[slice.segments.length - 1]

      return {
        origin: slice.origin.iata_code,
        originCity: slice.origin.city_name || slice.origin.name,
        destination: slice.destination.iata_code,
        destinationCity: slice.destination.city_name || slice.destination.name,
        departingAt: firstSegment?.departing_at,
        arrivingAt: lastSegment?.arriving_at,
        duration: slice.duration,
        stops: slice.segments.length - 1,
        segments: slice.segments.map((segment) => ({
          origin: segment.origin.iata_code,
          destination: segment.destination.iata_code,
          airline: segment.marketing_carrier?.name ?? null,
          // logo_symbol_url = icon only. logo_lockup_url = icon + wordmark.
          airlineLogo: segment.marketing_carrier?.logo_symbol_url ?? null,
          airlineLogoLockup: segment.marketing_carrier?.logo_lockup_url ?? null,
          flightNumber: segment.marketing_carrier_flight_number ?? null,
          aircraft: segment.aircraft?.name ?? null,
        })),
      }
    })

    const firstPassengerBaggage = offer.slices[0]?.segments[0]?.passengers?.[0]?.baggages
    const checkedBag = firstPassengerBaggage?.find((b) => b.type === 'checked')

    res.json({
      id: offer.id,
      totalAmount: offer.total_amount,
      totalCurrency: offer.total_currency,
      totalEmissionsKg: offer.total_emissions_kg,
      taxAmount: offer.tax_amount,
      taxCurrency: offer.tax_currency,
      checkedBagsIncluded: checkedBag?.quantity ?? 0,
      conditions: {
        refundable: offer.conditions?.refund_before_departure?.allowed ?? null,
        refundPenaltyAmount: offer.conditions?.refund_before_departure?.penalty_amount ?? null,
        refundPenaltyCurrency: offer.conditions?.refund_before_departure?.penalty_currency ?? null,
      },
      slices,
      passengerCount: offer.passengers?.length ?? 1,
    })
  } catch (error) {
    console.error('Fetching offer failed:', error)
    res.status(error.meta?.status || 500).json({
      error:
        error.errors?.[0]?.message ||
        'Failed to fetch this offer — it may have expired (Duffel offers are only valid for a limited time after search).',
    })
  }
}

// POST /api/flights/search
export const searchFlights = async (req, res) => {
  const { origin, destination, departureDate, returnDate, passengers, cabinClass } = req.body

  if (!origin || !destination || !departureDate) {
    return res.status(400).json({
      error: 'origin, destination, and departureDate are required',
    })
  }

  const slices = [{ origin, destination, departure_date: departureDate }]
  if (returnDate) {
    slices.push({ origin: destination, destination: origin, departure_date: returnDate })
  }

  try {
    const offerRequest = await duffel.offerRequests.create({
      slices,
      passengers: passengers?.length ? passengers : [{ type: 'adult' }],
      cabin_class: cabinClass || 'economy',
      return_offers: true,
    })

    const offers = offerRequest.data.offers.map((offer) => {
      const firstPassengerBaggage = offer.slices[0]?.segments[0]?.passengers?.[0]?.baggages
      const checkedBag = firstPassengerBaggage?.find((b) => b.type === 'checked')

      return {
        id: offer.id,
        totalAmount: offer.total_amount,
        totalCurrency: offer.total_currency,
        totalEmissionsKg: offer.total_emissions_kg,
        taxAmount: offer.tax_amount,
        taxCurrency: offer.tax_currency,
        checkedBagsIncluded: checkedBag?.quantity ?? 0,
        conditions: {
          refundable: offer.conditions?.refund_before_departure?.allowed ?? null,
          refundPenaltyAmount: offer.conditions?.refund_before_departure?.penalty_amount ?? null,
          refundPenaltyCurrency: offer.conditions?.refund_before_departure?.penalty_currency ?? null,
        },
        slices: offer.slices.map((slice) => {
          const firstSegment = slice.segments[0]
          const lastSegment = slice.segments[slice.segments.length - 1]

          return {
            origin: slice.origin.iata_code,
            originCity: slice.origin.city_name || slice.origin.name,
            destination: slice.destination.iata_code,
            destinationCity: slice.destination.city_name || slice.destination.name,
            departingAt: firstSegment?.departing_at,
            arrivingAt: lastSegment?.arriving_at,
            duration: slice.duration,
            stops: slice.segments.length - 1,
            segments: slice.segments.map((segment) => ({
              origin: segment.origin.iata_code,
              destination: segment.destination.iata_code,
              airline: segment.marketing_carrier?.name,
              airlineLogo: segment.marketing_carrier?.logo_symbol_url ?? null,
              flightNumber: segment.marketing_carrier_flight_number,
              aircraft: segment.aircraft?.name,
            })),
          }
        }),
      }
    })

    res.json({ offerRequestId: offerRequest.data.id, offers })
  } catch (error) {
    console.error('Duffel search failed:', error)
    res.status(error.meta?.status || 500).json({
      error: error.errors?.[0]?.message || 'Failed to search flights',
    })
  }
}