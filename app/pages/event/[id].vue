<template>
  <div>
    <div v-if="loading" class="d-flex justify-center py-8">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <template v-else-if="event">
      <!-- Header -->
      <div class="d-flex align-center gap-3 mb-6 flex-wrap">
        <v-btn icon variant="text" to="/dashboard">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        <div class="flex-grow-1">
          <h1 class="text-h4 font-weight-bold">{{ event.name }}</h1>
          <p v-if="event.description" class="text-body-2 text-medium-emphasis mt-1">{{ event.description }}</p>
        </div>
        <div class="d-flex gap-2 flex-wrap">
          <v-chip :color="event.type === 'recurring' ? 'primary' : 'accent'" variant="tonal">
            {{ event.type === 'recurring' ? 'Recurring' : 'One-time' }}
          </v-chip>
          <v-chip v-if="event.archived" color="grey" variant="tonal">Archived</v-chip>

          <!-- ICS Export button for organizer/admin -->
          <v-btn
            v-if="canConfirm"
            variant="tonal"
            color="secondary"
            size="small"
            :href="`/api/events/${eventId}/export`"
            target="_blank"
          >
            <v-icon start size="small">mdi-calendar-export</v-icon>
            ICS Export
          </v-btn>

          <!-- Absences button for organizer/admin -->
          <v-btn
            v-if="canConfirm"
            variant="tonal"
            color="warning"
            size="small"
            @click="openAbsencesDialog"
          >
            <v-icon start size="small">mdi-account-off</v-icon>
            Abwesenheiten
            <v-badge v-if="absenceCount > 0" :content="absenceCount" color="error" inline />
          </v-btn>

          <!-- History button -->
          <v-btn
            variant="tonal"
            color="info"
            size="small"
            @click="historyDialog = true"
          >
            <v-icon start size="small">mdi-history</v-icon>
            Historie
          </v-btn>
        </div>
      </div>

      <!-- Stats row -->
      <v-row class="mb-4">
        <v-col cols="6" sm="3">
          <v-card color="surface" rounded="lg">
            <v-card-text class="text-center pa-3">
              <div class="text-h5 font-weight-bold text-primary">{{ event.participantIds.length }}</div>
              <div class="text-caption text-medium-emphasis">Teilnehmer</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card color="surface" rounded="lg">
            <v-card-text class="text-center pa-3">
              <div class="text-h5 font-weight-bold text-success">{{ event.minParticipants }}</div>
              <div class="text-caption text-medium-emphasis">Minimum Spieler</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card color="surface" rounded="lg">
            <v-card-text class="text-center pa-3">
              <div class="text-h5 font-weight-bold text-secondary">{{ event.planningWindowWeeks }}</div>
              <div class="text-caption text-medium-emphasis">Wochen Fenster</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card color="surface" rounded="lg">
            <v-card-text class="text-center pa-3">
              <div class="text-h5 font-weight-bold text-warning">{{ activeConfirmedDates.length }}</div>
              <div class="text-caption text-medium-emphasis">Bestätigte Termine</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Participant chips -->
      <div class="mb-2">
        <span class="text-body-2 text-medium-emphasis mr-2">Teilnehmer:</span>
        <UserAvatar
          v-for="uid in event.participantIds"
          :key="uid"
          :username="getUserName(uid)"
          :size="32"
          class="mr-1"
        />
      </div>

      <!-- Required participants -->
      <div v-if="event.requiredParticipantIds?.length" class="mb-4 d-flex align-center gap-2 flex-wrap">
        <v-icon color="error" size="small">mdi-shield-star</v-icon>
        <span class="text-body-2 text-medium-emphasis">Pflichtteilnehmer:</span>
        <v-chip
          v-for="uid in event.requiredParticipantIds"
          :key="uid"
          color="error"
          variant="tonal"
          size="small"
        >
          {{ getUserName(uid) }}
        </v-chip>
      </div>

      <!-- Availability toggle hint -->
      <v-alert type="info" variant="tonal" density="compact" class="mb-4" icon="mdi-gesture-tap">
        Klicke auf einen Tag: einmal = <strong>Ja</strong> (verfügbar), zweimal = <strong>Vielleicht</strong>, dreimal = entfernen.
      </v-alert>

      <!-- Confirmed dates list -->
      <div v-if="activeConfirmedDates.length > 0" class="mb-4">
        <div class="text-body-2 text-medium-emphasis mb-2">Bestätigte Termine:</div>
        <div class="d-flex gap-2 flex-wrap">
          <v-chip
            v-for="entry in activeConfirmedDates"
            :key="entry.date"
            color="success"
            variant="elevated"
          >
            <v-icon start size="small">mdi-star</v-icon>
            {{ formatDisplayDate(entry.date) }}
            <span v-if="entry.location" class="ml-1 text-caption">@ {{ entry.location }}</span>
            <span v-if="entry.startTime" class="ml-1 text-caption">{{ entry.startTime }}</span>
          </v-chip>
        </div>
      </div>

      <!-- Calendar -->
      <v-card rounded="lg">
        <v-card-title class="pa-4">
          <v-icon start color="primary">mdi-calendar</v-icon>
          Verfügbarkeitskalender
          <span class="text-body-2 text-medium-emphasis ml-2">Klicke auf Tage um deine Verfügbarkeit zu markieren</span>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <CalendarGrid
            :event-id="event.id"
            :planning-window-weeks="event.planningWindowWeeks"
            :min-participants="event.minParticipants"
            :required-participant-ids="event.requiredParticipantIds || []"
            :can-confirm="canConfirm"
            :availabilities="availabilities"
            :confirmed-dates="confirmedDates"
            :current-user-id="currentUser?.id || ''"
            :allowed-weekdays="event.allowedWeekdays || []"
            :day-exceptions="event.dayExceptions || []"
            @update:availabilities="toggleAvailability"
            @confirm-date="handleConfirmDate"
          />
        </v-card-text>
      </v-card>
    </template>

    <v-alert v-else type="error" variant="tonal">Event not found</v-alert>

    <!-- Absences Dialog -->
    <v-dialog v-model="absencesDialog" max-width="600" scrollable>
      <v-card rounded="xl">
        <v-card-title class="pa-4">
          <v-icon start color="warning">mdi-account-off</v-icon>
          Abwesenheiten der Teilnehmer
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <div v-if="absenceEntries.length === 0" class="text-medium-emphasis text-center py-4">
            Keine Abwesenheiten eingetragen.
          </div>
          <div v-for="entry in absenceEntries" :key="entry.userId" class="mb-4">
            <div class="font-weight-medium mb-1">{{ entry.username }}</div>
            <v-chip
              v-for="absence in entry.absences"
              :key="absence.id"
              color="warning"
              variant="tonal"
              size="small"
              class="mr-1 mb-1"
            >
              {{ formatDisplayDate(absence.start) }} – {{ formatDisplayDate(absence.end) }}
              <span v-if="absence.note" class="ml-1">({{ absence.note }})</span>
            </v-chip>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="absencesDialog = false">Schließen</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- History Dialog -->
    <v-dialog v-model="historyDialog" max-width="700" scrollable>
      <v-card rounded="xl">
        <v-card-title class="pa-4">
          <v-icon start color="info">mdi-history</v-icon>
          Vergangene Termine — Historie
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <div v-if="pastConfirmedDates.length === 0" class="text-medium-emphasis text-center py-4">
            Keine vergangenen bestätigten Termine.
          </div>
          <v-timeline v-else density="compact" side="end">
            <v-timeline-item
              v-for="entry in pastConfirmedDates"
              :key="entry.date"
              :dot-color="entry.cancelled ? 'grey' : 'success'"
              size="small"
            >
              <template #opposite>
                <span class="text-caption">{{ formatDisplayDate(entry.date) }}</span>
              </template>
              <v-card variant="tonal" :color="entry.cancelled ? 'grey' : 'success'" class="pa-2">
                <div class="font-weight-medium">
                  {{ entry.cancelled ? 'Abgesagt' : 'Stattgefunden' }}
                  <span v-if="entry.rescheduledFrom" class="text-caption ml-1">(verschoben von {{ entry.rescheduledFrom }})</span>
                </div>
                <div v-if="entry.location" class="text-caption">
                  <v-icon size="x-small">mdi-map-marker</v-icon> {{ entry.location }}
                </div>
                <div v-if="entry.startTime" class="text-caption">
                  <v-icon size="x-small">mdi-clock</v-icon> {{ entry.startTime }}<template v-if="entry.endTime"> – {{ entry.endTime }}</template>
                </div>
                <!-- Who was available -->
                <div class="mt-1">
                  <span class="text-caption text-success mr-1">Ja:</span>
                  <span v-for="a in getAvailableOnDate(entry.date, 'yes')" :key="a.userId" class="text-caption mr-1">{{ a.username }}</span>
                  <span v-if="getAvailableOnDate(entry.date, 'yes').length === 0" class="text-caption text-medium-emphasis">–</span>
                </div>
                <div v-if="getAvailableOnDate(entry.date, 'maybe').length > 0" class="mt-1">
                  <span class="text-caption text-warning mr-1">Vielleicht:</span>
                  <span v-for="a in getAvailableOnDate(entry.date, 'maybe')" :key="a.userId" class="text-caption mr-1">{{ a.username }}</span>
                </div>
              </v-card>
            </v-timeline-item>
          </v-timeline>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="historyDialog = false">Schließen</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const eventId = route.params.id as string
const { user: currentUser, isAdmin } = useAuth()

interface ConfirmedDateEntry {
  date: string
  location: string
  startTime: string
  endTime: string
  cancelled: boolean
  rescheduledFrom: string | null
  rescheduledTo: string | null
}

interface EventType {
  id: string
  name: string
  description: string
  type: 'recurring' | 'one-time'
  planningWindowWeeks: number
  minParticipants: number
  organizerId: string
  participantIds: string[]
  requiredParticipantIds: string[]
  notificationMethod: string
  createdAt: string
  archived: boolean
  allowedWeekdays: number[]
  dayExceptions: string[]
  discordChannelId?: string
  reminderEnabled: boolean
  reminderDaysBefore: number
}

interface AvailabilityEntry {
  userId: string
  username: string
  dates: string[]
  maybeDates: string[]
}

interface AbsenceEntry {
  id: string
  start: string
  end: string
  note: string
}

interface UserAbsenceEntry {
  userId: string
  username: string
  absences: AbsenceEntry[]
}

const loading = ref(true)
const event = ref<EventType | null>(null)
const availabilities = ref<AvailabilityEntry[]>([])
const confirmedDates = ref<ConfirmedDateEntry[]>([])
const users = ref<{ id: string; username: string }[]>([])

// Absence dialog
const absencesDialog = ref(false)
const absenceEntries = ref<UserAbsenceEntry[]>([])

// History dialog
const historyDialog = ref(false)

const canConfirm = computed(() =>
  isAdmin.value || event.value?.organizerId === currentUser.value?.id
)

const activeConfirmedDates = computed(() =>
  confirmedDates.value.filter(c => !c.cancelled)
)

const pastConfirmedDates = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return confirmedDates.value
    .filter(c => new Date(c.date + 'T00:00:00') < today)
    .sort((a, b) => b.date.localeCompare(a.date))
})

const absenceCount = computed(() => absenceEntries.value.reduce((sum, e) => sum + e.absences.length, 0))

async function loadData() {
  loading.value = true
  try {
    const [eventData, availData, confirmedData, usersData] = await Promise.all([
      $fetch<EventType>(`/api/events/${eventId}`),
      $fetch<AvailabilityEntry[]>(`/api/events/${eventId}/availability`),
      $fetch<{ confirmedDates: ConfirmedDateEntry[] }>(`/api/events/${eventId}/confirmed-dates`).catch(() => ({ confirmedDates: [] })),
      $fetch<{ id: string; username: string }[]>('/api/users').catch(() => []),
    ])
    event.value = eventData
    availabilities.value = availData
    confirmedDates.value = confirmedData.confirmedDates || []
    users.value = usersData
  } catch (e) {
    console.error('Failed to load event data:', e)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

// Cycle: nothing → yes → maybe → nothing
async function toggleAvailability(dateStr: string) {
  const myEntry = availabilities.value.find(a => a.userId === currentUser.value?.id)
  const myYesDates = myEntry?.dates || []
  const myMaybeDates = myEntry?.maybeDates || []

  const isYes = myYesDates.includes(dateStr)
  const isMaybe = myMaybeDates.includes(dateStr)

  let newYesDates = [...myYesDates]
  let newMaybeDates = [...myMaybeDates]
  let type: 'yes' | 'maybe' = 'yes'

  if (!isYes && !isMaybe) {
    // nothing → yes
    newYesDates = [...myYesDates, dateStr]
    type = 'yes'
    await $fetch(`/api/events/${eventId}/availability`, {
      method: 'POST',
      body: { dates: newYesDates, type: 'yes' },
    })
  } else if (isYes) {
    // yes → maybe: remove from yes, add to maybe
    newYesDates = myYesDates.filter(d => d !== dateStr)
    newMaybeDates = [...myMaybeDates, dateStr]
    await $fetch(`/api/events/${eventId}/availability`, {
      method: 'POST',
      body: { dates: newYesDates, type: 'yes' },
    })
    await $fetch(`/api/events/${eventId}/availability`, {
      method: 'POST',
      body: { dates: newMaybeDates, type: 'maybe' },
    })
  } else if (isMaybe) {
    // maybe → nothing: remove from maybe
    newMaybeDates = myMaybeDates.filter(d => d !== dateStr)
    await $fetch(`/api/events/${eventId}/availability`, {
      method: 'POST',
      body: { dates: newMaybeDates, type: 'maybe' },
    })
  }

  // Refresh
  availabilities.value = await $fetch<AvailabilityEntry[]>(`/api/events/${eventId}/availability`)
}

async function handleConfirmDate(payload: {
  date: string
  remove?: boolean
  cancel?: boolean
  reschedule?: boolean
  newDate?: string
  location?: string
  startTime?: string
  endTime?: string
}) {
  const result = await $fetch<{ confirmedDates: ConfirmedDateEntry[] }>(`/api/events/${eventId}/confirm-date`, {
    method: 'POST',
    body: payload,
  })
  confirmedDates.value = result.confirmedDates
}

async function openAbsencesDialog() {
  try {
    absenceEntries.value = await $fetch<UserAbsenceEntry[]>(`/api/absences/event/${eventId}`)
  } catch {
    absenceEntries.value = []
  }
  absencesDialog.value = true
}

function getAvailableOnDate(dateStr: string, type: 'yes' | 'maybe') {
  return availabilities.value.filter(a =>
    type === 'yes' ? a.dates.includes(dateStr) : (a.maybeDates || []).includes(dateStr)
  )
}

function getUserName(userId: string): string {
  return users.value.find(u => u.id === userId)?.username || userId
}

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('de-DE', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}
</script>
