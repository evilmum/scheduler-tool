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
        </div>
      </div>

      <!-- Stats row -->
      <v-row class="mb-4">
        <v-col cols="6" sm="3">
          <v-card color="surface" rounded="lg">
            <v-card-text class="text-center pa-3">
              <div class="text-h5 font-weight-bold text-primary">{{ event.participantIds.length }}</div>
              <div class="text-caption text-medium-emphasis">Participants</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card color="surface" rounded="lg">
            <v-card-text class="text-center pa-3">
              <div class="text-h5 font-weight-bold text-success">{{ event.minParticipants }}</div>
              <div class="text-caption text-medium-emphasis">Minimum Players</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card color="surface" rounded="lg">
            <v-card-text class="text-center pa-3">
              <div class="text-h5 font-weight-bold text-secondary">{{ event.planningWindowWeeks }}</div>
              <div class="text-caption text-medium-emphasis">Weeks Window</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card color="surface" rounded="lg">
            <v-card-text class="text-center pa-3">
              <div class="text-h5 font-weight-bold text-warning">{{ confirmedDates.length }}</div>
              <div class="text-caption text-medium-emphasis">Confirmed Dates</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Participant chips -->
      <div class="mb-2">
        <span class="text-body-2 text-medium-emphasis mr-2">Participants:</span>
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

      <!-- Confirmed dates list -->
      <div v-if="confirmedDates.length > 0" class="mb-4">
        <div class="text-body-2 text-medium-emphasis mb-2">Confirmed Sessions:</div>
        <div class="d-flex gap-2 flex-wrap">
          <v-chip
            v-for="date in confirmedDates"
            :key="date"
            color="success"
            variant="elevated"
          >
            <v-icon start size="small">mdi-star</v-icon>
            {{ formatDisplayDate(date) }}
          </v-chip>
        </div>
      </div>

      <!-- Calendar -->
      <v-card rounded="lg">
        <v-card-title class="pa-4">
          <v-icon start color="primary">mdi-calendar</v-icon>
          Availability Calendar
          <span class="text-body-2 text-medium-emphasis ml-2">Click days to mark your availability</span>
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
            @update:availabilities="toggleAvailability"
            @confirm-date="handleConfirmDate"
          />
        </v-card-text>
      </v-card>
    </template>

    <v-alert v-else type="error" variant="tonal">Event not found</v-alert>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const eventId = route.params.id as string
const { user: currentUser, isAdmin } = useAuth()

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
}

interface AvailabilityEntry {
  userId: string
  username: string
  dates: string[]
}

const loading = ref(true)
const event = ref<EventType | null>(null)
const availabilities = ref<AvailabilityEntry[]>([])
const confirmedDates = ref<string[]>([])
const users = ref<{ id: string; username: string }[]>([])

const canConfirm = computed(() =>
  isAdmin.value || event.value?.organizerId === currentUser.value?.id
)

async function loadData() {
  loading.value = true
  try {
    const [eventData, availData, confirmedData, usersData] = await Promise.all([
      $fetch<EventType>(`/api/events/${eventId}`),
      $fetch<AvailabilityEntry[]>(`/api/events/${eventId}/availability`),
      $fetch<{ confirmedDates: string[] }>(`/api/events/${eventId}/confirm-date`).catch(() => ({ confirmedDates: [] })),
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

// Load confirmed dates from a GET endpoint
async function loadConfirmedDates() {
  try {
    const data = await $fetch<{ confirmedDates: string[] }>(`/api/events/${eventId}/confirmed-dates`).catch(() => null)
    if (data) confirmedDates.value = data.confirmedDates
  } catch {}
}

onMounted(loadData)

async function toggleAvailability(dateStr: string) {
  const myDates = availabilities.value.find(a => a.userId === currentUser.value?.id)?.dates || []
  const newDates = myDates.includes(dateStr)
    ? myDates.filter(d => d !== dateStr)
    : [...myDates, dateStr]

  await $fetch(`/api/events/${eventId}/availability`, {
    method: 'POST',
    body: { dates: newDates },
  })

  // Refresh availabilities
  availabilities.value = await $fetch<AvailabilityEntry[]>(`/api/events/${eventId}/availability`)
}

async function handleConfirmDate({ date, remove }: { date: string; remove: boolean }) {
  const result = await $fetch<{ confirmedDates: string[] }>(`/api/events/${eventId}/confirm-date`, {
    method: 'POST',
    body: { date, remove },
  })
  confirmedDates.value = result.confirmedDates
}

function getUserName(userId: string): string {
  return users.value.find(u => u.id === userId)?.username || userId
}

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}
</script>
