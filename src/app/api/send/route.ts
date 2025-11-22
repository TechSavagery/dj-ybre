// Import necessary modules
import { NextResponse, NextRequest } from 'next/server'
import EmailTemplate from '../../../components/emailTemplate'
import { Resend } from 'resend'

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    // Log API key status (masked for security)
    const apiKey = process.env.RESEND_API_KEY
    const apiKeyMasked = apiKey 
      ? `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`
      : 'NOT SET'
    console.log('📧 Resend API Key Status:', apiKey ? `Set (${apiKeyMasked})` : 'NOT SET')
    console.log('📧 RESEND env variable:', process.env.RESEND || 'not set (will send emails)')

    // Parse the request body
    const { firstName, lastName, email, message, venue, phone, date, subject, 'event-type': eventType, package: packageName, startTime, endTime } =
      await request.json()

    console.log('📧 Received form data:', {
      firstName,
      lastName,
      email,
      venue,
      phone,
      date,
      eventType,
      packageName,
      startTime,
      endTime,
      messageLength: message?.length || 0,
    })

    // Check if RESEND is set to false (for testing mode)
    if (process.env.RESEND === 'false') {
      console.log('⚠️ RESEND is set to false - simulating email send')
      await new Promise((resolve) => setTimeout(resolve, 7500)) // Simulate delay
      return NextResponse.json({
        success: true,
        message: 'Email sending simulated.',
      })
    }

    // Check if API key is missing
    if (!apiKey) {
      console.error('❌ RESEND_API_KEY is not set in environment variables')
      return NextResponse.json(
        { error: 'Email service is not configured. Please check server logs.' },
        { status: 500 }
      )
    }

    const emailPayload = {
      from: 'DJ YBRE Leads <leads@djybre.com>',
      to: 'ladell@djybre.com',
      subject: `New Lead: ${firstName} ${lastName}`,
      react: EmailTemplate({ firstName, lastName, email, message, venue, phone, date, eventType, package: packageName, startTime, endTime }),
      replyTo: email,
    }

    console.log('📧 Sending email with payload:', {
      from: emailPayload.from,
      to: emailPayload.to,
      subject: emailPayload.subject,
      replyTo: emailPayload.replyTo,
    })

    // Send the email using Resend
    const { data, error } = await resend.emails.send(emailPayload)

    // Log the full response
    console.log('📧 Resend API Response:')
    console.log('  - Success:', !error)
    console.log('  - Data:', JSON.stringify(data, null, 2))
    if (error) {
      console.error('  - Error:', JSON.stringify(error, null, 2))
    }

    // Check if there was an error
    if (error) {
      console.error('❌ Email sending error:', error)
      return NextResponse.json(
        { 
          error: error.message,
          errorDetails: error,
        },
        { status: 500 }
      )
    }

    console.log('✅ Email sent successfully!', data)

    // Return success response
    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Error occurred:', error)

    // Ensure error is properly typed before accessing `message`
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(
      { error: 'An unknown error occurred' },
      { status: 500 },
    )
  }
}
