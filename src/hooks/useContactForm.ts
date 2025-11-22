"use client"
import { useState, useEffect } from 'react'
import { sendEmail } from '@/lib/sendEmail'

export const useContactForm = (initialPackage?: string) => {
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
    package: '',
    startTime: '',
    endTime: '',
  })

  // Set initial package from URL params if provided
  useEffect(() => {
    if (initialPackage) {
      setFormData((prev) => ({ ...prev, package: initialPackage }))
    }
  }, [initialPackage])

  const [sent, setSent] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const formatDateInput = (value: string): string => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '')
    
    // Limit to 8 digits (allows for MMDDYYYY format)
    const limitedDigits = digits.slice(0, 8)
    
    if (limitedDigits.length === 0) {
      return ''
    } else if (limitedDigits.length <= 2) {
      // Just month (1 or 12) - no slash yet
      return limitedDigits
    } else if (limitedDigits.length <= 4) {
      // Month and day - determine if month is 1 or 2 digits
      const firstTwo = parseInt(limitedDigits.slice(0, 2), 10)
      
      if (firstTwo > 12) {
        // First digit is month, rest is day
        return `${limitedDigits[0]}/${limitedDigits.slice(1)}`
      } else {
        // Could be 1 or 2 digit month - use 2 digits if it makes sense
        // If we have 3+ digits, check if first 2 could be month
        if (limitedDigits.length === 3) {
          // 3 digits: could be "1/12" or "12/1"
          // If first two > 12, use single digit month
          return `${limitedDigits[0]}/${limitedDigits.slice(1)}`
        } else {
          // 4 digits: "12/25" or "1/225" - prefer 2/2 split
          return `${limitedDigits.slice(0, 2)}/${limitedDigits.slice(2)}`
        }
      }
    } else {
      // Month, day, and year - determine splits intelligently
      const firstTwo = parseInt(limitedDigits.slice(0, 2), 10)
      
      let month: string
      let remaining: string
      
      if (firstTwo > 12) {
        // Single digit month
        month = limitedDigits[0]
        remaining = limitedDigits.slice(1)
      } else {
        // Two digit month (or could be single, but prefer 2)
        month = limitedDigits.slice(0, 2)
        remaining = limitedDigits.slice(2)
      }
      
      // Now determine day (1 or 2 digits)
      const dayFirstTwo = parseInt(remaining.slice(0, 2), 10)
      
      let day: string
      let year: string
      
      if (dayFirstTwo > 31) {
        // Single digit day
        day = remaining[0]
        year = remaining.slice(1)
      } else {
        // Two digit day
        day = remaining.slice(0, 2)
        year = remaining.slice(2)
      }
      
      return `${month}/${day}/${year}`
    }
  }

  const validateDate = (dateString: string): boolean => {
    if (!dateString || dateString.length < 6) return false // At least M/D/YY
    
    const parts = dateString.split('/')
    if (parts.length !== 3) return false
    
    const month = parseInt(parts[0], 10)
    const day = parseInt(parts[1], 10)
    const year = parseInt(parts[2], 10)
    
    // Basic validation
    if (isNaN(month) || month < 1 || month > 12) return false
    if (isNaN(day) || day < 1 || day > 31) return false
    if (isNaN(year) || year < 1900 || year > 2100) return false
    
    // Check if date is valid (handles leap years, etc.)
    const date = new Date(year, month - 1, day)
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    )
  }

  const handleInputChange = (e: { target: { name: any; value: any } }) => {
    const { name, value } = e.target
    
    if (name === 'date') {
      const formatted = formatDateInput(value)
      setFormData((prev) => ({ ...prev, [name]: formatted }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    
    // Validate date if provided
    if (formData.date && !validateDate(formData.date)) {
      alert('Please enter a valid date in MM/DD/YYYY format (e.g., 1/1/2026)')
      return
    }
    
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
        package: '',
        startTime: '',
        endTime: '',
      })
      // Confirmation stays visible indefinitely - no timeout
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
