export const sendEmail = async (formData: any) => {
  try {
    console.log('📤 Sending email request with form data:', formData)
    
    const response = await fetch('/api/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })

    console.log('📥 API Response Status:', response.status, response.statusText)

    const responseData = await response.json()
    console.log('📥 API Response Data:', responseData)

    if (!response.ok) {
      console.error('❌ API Error Response:', responseData)
      throw new Error(responseData.error || 'Failed to send the message. Please try again.')
    }

    console.log('✅ Email sent successfully from client')
    return { success: true, data: responseData }
  } catch (error) {
    console.error('❌ Client-side error sending email:', error)
    if (error instanceof Error) {
      return { success: false, message: error.message }
    }

    return { success: false, message: 'An unknown error occurred.' }
  }
}
