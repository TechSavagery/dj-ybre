import { Container } from '@/components/Container'
import { PageIntro } from '@/components/PageIntro'
import { FadeIn } from '@/components/FadeIn'
import { Border } from '@/components/Border'
import { Button } from '@/components/Button'

export default function EventPortalIndexPage() {
  return (
    <>
      <PageIntro eyebrow="Event Portal" title="Client event intake portal">
        <p>
          Create event-specific forms, send personalized links to clients, and review every
          submitted detail in one place.
        </p>
      </PageIntro>

      <Container className="mt-24 sm:mt-32 lg:mt-40">
        <FadeIn>
          <Border className="p-8">
            <h2 className="text-xl font-semibold text-neutral-950">How it works</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-neutral-600">
              <li>Create or customize an event form template.</li>
              <li>Create an event and generate a personalized client link.</li>
              <li>Client submits details (including Spotify requests).</li>
              <li>Review a clean event digest in the manager dashboard.</li>
            </ol>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button href="/event-portal/manage">Open manager</Button>
              <Button href="/event-portal/manage/templates">Manage templates</Button>
            </div>
          </Border>
        </FadeIn>
      </Container>
    </>
  )
}

