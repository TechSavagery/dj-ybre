import { permanentRedirect } from 'next/navigation'

const INSTAGRAM_URL = 'https://instagram.com/djybre'

export default function LinksPage() {
  permanentRedirect(INSTAGRAM_URL)
}

