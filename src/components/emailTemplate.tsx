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
  subject: string
  message: string
}

const EmailTemplate: React.FC<EmailTemplateProps> = ({
  firstName,
  lastName,
  email,
  subject,
  message,
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

            <Text style={paragraph}>Subject: {subject}</Text>

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
