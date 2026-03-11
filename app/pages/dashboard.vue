<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">Dashboard</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">Deine bevorstehenden Kampagnen und Termine</p>
      </div>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4" closable>
      {{ error }}
    </v-alert>

    <div v-if="loading" class="d-flex justify-center py-8">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <template v-else>
      <!-- Feature 9: Upcoming confirmed dates section -->
      <template v-if="upcomingDates.length > 0">
        <h2 class="text-h6 mb-3 d-flex align-center gap-2">
          <v-icon color="success">mdi-calendar-star</v-icon>
          Deine nächsten Termine ({{ upcomingDates.length }})
        </h2>
        <v-card rounded="lg" class="mb-6">
          <v-list>
            <v-list-item
              v-for="item in upcomingDates"
              :key="`${item.eventId}-${item.entry.date}`"
              :to="`/event/${item.eventId}`"
              rounded="lg"
            >
              <template #prepend>
                <v-icon color="success" class="mr-2">mdi-star</v-icon>
              </template>
              <v-list-item-title class="font-weight-medium">
                {{ item.eventName }}
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ formatDate(item.entry.date) }}
                <span v-if="item.entry.location" class="ml-2">
                  <v-icon size="x-small">mdi-map-marker</v-icon> {{ item.entry.location }}
                </span>
                <span v-if="item.entry.startTime" class="ml-2">
                  <v-icon size="x-small">mdi-clock</v-icon> {{ item.entry.startTime }}<template v-if="item.entry.endTime"> – {{ item.entry.endTime }}</template>
                </span>
              </v-list-item-subtitle>
              <template #append>
                <v-btn
                  icon
                  size="small"
                  variant="text"
                  color="secondary"
                  :href="`/api/events/${item.eventId}/export`"
                  target="_blank"
                  title="ICS herunterladen"
                  @click.stop
                >
                  <v-icon size="small">mdi-calendar-export</v-icon>
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </template>

      <div v-if="activeEvents.length === 0" class="text-center py-12">
        <v-icon size="64" color="primary" class="mb-4">mdi-calendar-blank</v-icon>
        <h3 class="text-h6 text-medium-emphasis">Keine Events vorhanden</h3>
        <p class="text-body-2 text-medium-emphasis mt-1">
          {{ isAdmin ? 'Erstelle Events im Admin-Bereich.' : 'Bitte deinen DM, dich zu einem Event hinzuzufügen.' }}
        </p>
        <v-btn v-if="isAdmin" color="primary" to="/admin/events" class="mt-4">
          <v-icon start>mdi-plus</v-icon>
          Event erstellen
        </v-btn>
      </div>

      <div v-else>
        <h2 class="text-h6 mb-3">Aktive Kampagnen ({{ activeEvents.length }})</h2>
        <v-row>
          <v-col v-for="event in activeEvents" :key="event.id" cols="12" md="6" lg="4">
            <EventCard :event="event" />
          </v-col>
        </v-row>

        <template v-if="archivedEvents.length > 0">
          <h2 class="text-h6 mb-3 mt-6">Archiviert ({{ archivedEvents.length }})</h2>
          <v-row>
            <v-col v-for="event in archivedEvents" :key="event.id" cols="12" md="6" lg="4">
              <EventCard :event="event" />
            </v-col>
          </v-row>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { isAdmin, user: currentUser } = useAuth()
const { events, loading, error, fetchEvents } = useEvents()

interface ConfirmedDateEntry {
  date: string
  location: string
  startTime: string
  endTime: string
  cancelled: boolean
  rescheduledFrom: string | null
  rescheduledTo: string | null
}

interface UpcomingDateItem {
  eventId: string
  eventName: string
  entry: ConfirmedDateEntry
}

const upcomingDates = ref<UpcomingDateItem[]>([])

await fetchEvents()

const activeEvents = computed(() => events.value.filter(e => !e.archived))
const archivedEvents = computed(() => events.value.filter(e => e.archived))

// Feature 9: load upcoming confirmed dates for all events the user participates in
onMounted(async () => {
  if (!currentUser.value) return

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const myEvents = events.value.filter(e =>
    e.participantIds?.includes(currentUser.value!.id) ||
    e.organizerId === currentUser.value!.id
  )

  const results: UpcomingDateItem[] = []

  await Promise.all(myEvents.map(async (ev) => {
    try {
      const data = await $fetch<{ confirmedDates: ConfirmedDateEntry[] }>(`/api/events/${ev.id}/confirmed-dates`)
      const upcoming = (data.confirmedDates || []).filter(entry => {
        if (entry.cancelled) return false
        return new Date(entry.date + 'T00:00:00') >= today
      })
      for (const entry of upcoming) {
        results.push({ eventId: ev.id, eventName: ev.name, entry })
      }
    } catch {}
  }))

  // Sort by date ascending
  results.sort((a, b) => a.entry.date.localeCompare(b.entry.date))
  upcomingDates.value = results
})

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('de-DE', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
}
</script>
