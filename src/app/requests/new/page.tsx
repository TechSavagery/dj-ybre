import { redirect } from 'next/navigation'

export default function RequestsNewRedirect() {
  redirect('/requests/manage')
}

