"use client"
import { useState } from 'react'
import { sendEmail } from '@/lib/sendEmail'

export const useContactForm = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    subject: '',
    message: '',
    venue: '',
    phone: '',
    date: '',
    'event-type': '',
  })

  const [sent, setSent] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const handleInputChange = (e: { target: { name: any; value: any } }) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    setIsSending(true)

    const response = await sendEmail(formData)

    if (response.success) {
      setSent(true)
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        subject: '',
        message: '',
        venue: '',
        phone: '',
        date: '',
        'event-type': '',
      })

      setTimeout(() => {
        setSent(false)
      }, 2200)
    } else {
      alert(response.message)
    }

    setIsSending(false)
  }

  return {
    formData,
    sent,
    isSending,
    handleInputChange,
    handleSubmit,
  }
}

export default useContactForm;
