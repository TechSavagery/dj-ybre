import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Html,
  Section,
  Text,
} from '@react-email/components'

interface EmailTemplateProps {
  firstName: string
  lastName: string
  email: string
  message: string
  venue?: string
  phone?: string
  date?: string
  eventType?: string
  package?: string
  startTime?: string
  endTime?: string
}

const EmailTemplate: React.FC<EmailTemplateProps> = ({
  firstName,
  lastName,
  email,
  message,
  venue,
  phone,
  date,
  eventType,
  package: packageName,
  startTime,
  endTime,
}) => {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={content}>
            <Text style={paragraph}>
              Name: {firstName} {lastName}
            </Text>

            <Text style={paragraph}>Email: {email}</Text>

            {phone && <Text style={paragraph}>Phone: {phone}</Text>}

            {packageName && <Text style={paragraph}>Package: {packageName}</Text>}

            {venue && <Text style={paragraph}>Venue: {venue}</Text>}

            {date && <Text style={paragraph}>Event Date: {date}</Text>}

            {startTime && <Text style={paragraph}>Start Time: {startTime}</Text>}

            {endTime && <Text style={paragraph}>End Time: {endTime}</Text>}

            {eventType && !packageName && (
              <Text style={paragraph}>Event Type: {eventType}</Text>
            )}

            {eventType && packageName && packageName !== 'Wedding Full' && packageName !== 'Wedding Reception Only' && (
              <Text style={paragraph}>Event Type: {eventType}</Text>
            )}

            <Text style={paragraph}>Message: {message}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f3f3f5',
  fontFamily: 'HelveticaNeue,Helvetica,Arial,sans-serif',
}

const paragraph = {
  fontSize: '15px',
  lineHeight: '21px',
  color: '#3c3f44',
}

const container = {
  width: '680px',
  maxWidth: '100%',
  margin: '0 auto',
  backgroundColor: '#ffffff',
}

const content = {
  padding: '30px 30px 40px 30px',
}

export default EmailTemplate
