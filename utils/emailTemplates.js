const formatDate = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Email sent immediately after a booking is confirmed.
export const confirmationEmailHtml = (booking) => {
  const leadPassenger = booking.passengers[0]
  const outbound = booking.legs[0]
  const returnLeg = booking.legs[1]
  const viewUrl = `${process.env.CLIENT_DOMAIN}/booking/${booking.pnr}`

  return `
  <div style="max-width:480px;margin:0 auto;font-family:Arial,sans-serif;background:#f5f6fc;padding:24px;">
    <div style="background:#ffffff;border-radius:16px;overflow:hidden;">
      <div style="background:#5e69e8;padding:24px;text-align:center;">
        <span style="color:#ffffff;font-size:20px;font-weight:bold;">Onefly</span>
      </div>
      <div style="padding:32px 24px;text-align:center;">
        <div style="width:48px;height:48px;border-radius:50%;background:#e1e7ff;display:inline-block;line-height:48px;margin-bottom:16px;">
          <span style="color:#5e69e8;font-size:22px;">&#10003;</span>
        </div>
        <h1 style="font-size:18px;color:#12131a;margin:0 0 8px;">You're all set, ${leadPassenger.firstName}!</h1>
        <p style="font-size:14px;color:#5f5e5a;margin:0 0 24px;">
          Your trip from ${outbound.originCity} (${outbound.origin}) to ${outbound.destinationCity} (${outbound.destination}) is booked and paid in full. Here's a quick summary.
        </p>
        <table style="width:100%;background:#f5f6fc;border-radius:12px;font-size:13px;color:#12131a;border-collapse:collapse;">
          <tr><td style="padding:10px 14px;color:#5f5e5a;">Booking ref</td><td style="padding:10px 14px;text-align:right;font-weight:bold;">${booking.pnr}</td></tr>
          <tr><td style="padding:10px 14px;color:#5f5e5a;">Outbound</td><td style="padding:10px 14px;text-align:right;font-weight:bold;">${formatDate(outbound.departingAt)}</td></tr>
          ${returnLeg ? `<tr><td style="padding:10px 14px;color:#5f5e5a;">Return</td><td style="padding:10px 14px;text-align:right;font-weight:bold;">${formatDate(returnLeg.departingAt)}</td></tr>` : ''}
          <tr><td style="padding:10px 14px;color:#5f5e5a;">Total paid</td><td style="padding:10px 14px;text-align:right;font-weight:bold;">${booking.totalCurrency} ${booking.totalAmount}</td></tr>
        </table>
        <a href="${viewUrl}" style="display:block;margin-top:24px;background:#5e69e8;color:#ffffff;text-decoration:none;padding:14px;border-radius:10px;font-size:14px;font-weight:bold;">View full itinerary</a>
        <p style="font-size:12px;color:#848590;margin-top:24px;">
          Need help? Reply to this email or contact support@onefly.com<br/>
          Onefly Travel Ltd, Victoria Island, Lagos
        </p>
      </div>
    </div>
  </div>`
}