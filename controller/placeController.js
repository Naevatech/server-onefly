// GET /api/places/suggestions?query=lon
export const getPlaceSuggestions = async (req, res) => {
  const { query } = req.query

  if (!query || typeof query !== 'string' || query.trim().length < 2) {
    return res.json({ data: [] })
  }

  try {
    const response = await fetch(
      `https://api.duffel.com/places/suggestions?query=${encodeURIComponent(query.trim())}`,
      {
        headers: {
          Accept: 'application/json',
          'Duffel-Version': 'v2',
          Authorization: `Bearer ${process.env.DUFFEL_ACCESS_TOKEN}`,
        },
      },
    )

    if (!response.ok) {
      const body = await response.json().catch(() => null)
      return res.status(response.status).json({
        error: body?.errors?.[0]?.message || 'Failed to fetch place suggestions',
      })
    }

    const body = await response.json()
    //NOTE
    // Trim Duffel's place object down to what the autocomplete dropdown
    // It renders — city name, the specific place's own name
    // its IATA code, and its type.
    const suggestions = body.data.map((place) => ({
      id: place.id,
      type: place.type,
      name: place.name,
      cityName: place.city_name || place.city?.name || place.name,
      iataCode: place.iata_code,
    }))

    res.json({ data: suggestions })
  } catch (error) {
    console.error('Place suggestions request failed:', error)
    res.status(500).json({ error: 'Failed to fetch place suggestions' })
  }
}