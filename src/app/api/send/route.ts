// Import necessary modules
import { NextResponse, NextRequest } from 'next/server'
import EmailTemplate from '../../../components/emailTemplate'
import { Resend } from 'resend'

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const { firstName, lastName, email, subject, message } =
      await request.json()

    // Check if RESEND is set to false (for testing mode)
    if (process.env.RESEND === 'false') {
      await new Promise((resolve) => setTimeout(resolve, 7500)) // Simulate delay
      return NextResponse.json({
        success: true,
        message: 'Email sending simulated.',
      })
    }

    // Send the email using Resend
    const { data, error } = await resend.emails.send({
      from: 'DJ YBRE Leads <leads@djybre.com>',
      to: 'info@djybre.com',
      subject: `New Lead: ${firstName} ${lastName}`,
      react: EmailTemplate({ firstName, lastName, email, subject, message }),
      replyTo: email,
    })

    // Check if there was an error
    if (error) {
      console.error('Email sending error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Return success response
    return NextResponse.json(data)
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
