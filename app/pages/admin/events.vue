<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">Event Management</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">Manage campaigns and sessions</p>
      </div>
      <v-btn color="primary" @click="openAddDialog">
        <v-icon start>mdi-calendar-plus</v-icon>
        Add Event
      </v-btn>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4" closable @click:close="error = ''">
      {{ error }}
    </v-alert>

    <v-card rounded="lg">
      <v-data-table
        :headers="headers"
        :items="events"
        :loading="loading"
        item-value="id"
        hover
      >
        <template #item.name="{ item }">
          <div class="d-flex align-center gap-2">
            <v-icon :color="item.archived ? 'grey' : 'primary'" size="small">
              {{ item.type === 'recurring' ? 'mdi-calendar-sync' : 'mdi-calendar-star' }}
            </v-icon>
            <span class="font-weight-medium">{{ item.name }}</span>
            <v-chip v-if="item.archived" size="x-small" color="grey">Archived</v-chip>
          </div>
        </template>
        <template #item.type="{ item }">
          <v-chip :color="item.type === 'recurring' ? 'primary' : 'accent'" variant="tonal" size="small">
            {{ item.type }}
          </v-chip>
        </template>
        <template #item.participantIds="{ item }">
          <div class="d-flex gap-1">
            <UserAvatar
              v-for="uid in item.participantIds.slice(0, 4)"
              :key="uid"
              :username="getUserName(uid)"
              :size="24"
            />
            <span v-if="item.participantIds.length > 4" class="text-caption text-medium-emphasis">
              +{{ item.participantIds.length - 4 }}
            </span>
          </div>
        </template>
        <template #item.actions="{ item }">
          <v-btn icon size="small" variant="text" :to="`/event/${item.id}`" title="View Calendar">
            <v-icon>mdi-calendar-eye</v-icon>
          </v-btn>
          <v-btn icon size="small" variant="text" @click="openEditDialog(item)" title="Edit">
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          <v-btn icon size="small" variant="text" :color="item.archived ? 'success' : 'warning'" @click="toggleArchive(item)" :title="item.archived ? 'Unarchive' : 'Archive'">
            <v-icon>{{ item.archived ? 'mdi-archive-off' : 'mdi-archive' }}</v-icon>
          </v-btn>
          <v-btn icon size="small" variant="text" color="error" @click="confirmDelete(item)" title="Delete">
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- Add/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="700" scrollable>
      <v-card rounded="xl">
        <v-card-title class="pa-4">{{ editingEvent ? 'Edit Event' : 'Add Event' }}</v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="form.name"
                label="Event Name"
                prepend-inner-icon="mdi-calendar"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            <v-col cols="12">
              <v-textarea
                v-model="form.description"
                label="Description"
                prepend-inner-icon="mdi-text"
                variant="outlined"
                density="comfortable"
                rows="2"
                auto-grow
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="form.type"
                label="Event Type"
                :items="[{ title: 'Recurring', value: 'recurring' }, { title: 'One-time', value: 'one-time' }]"
                prepend-inner-icon="mdi-calendar-sync"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="form.notificationMethod"
                label="Notifications"
                :items="[
                  { title: 'None', value: 'none' },
                  { title: 'Discord', value: 'discord' },
                  { title: 'Email', value: 'email' },
                  { title: 'Both', value: 'both' },
                ]"
                prepend-inner-icon="mdi-bell"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-slider
                v-model="form.planningWindowWeeks"
                label="Planning Window (weeks)"
                :min="1"
                :max="12"
                :step="1"
                thumb-label
                color="primary"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-slider
                v-model="form.minParticipants"
                label="Min Participants"
                :min="1"
                :max="10"
                :step="1"
                thumb-label
                color="success"
              />
            </v-col>
            <v-col cols="12">
              <v-select
                v-model="form.organizerId"
                label="Organizer"
                :items="userItems"
                prepend-inner-icon="mdi-account-star"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            <v-col cols="12">
              <v-select
                v-model="form.participantIds"
                label="Participants"
                :items="userItems"
                prepend-inner-icon="mdi-account-group"
                variant="outlined"
                density="comfortable"
                multiple
                chips
                closable-chips
              />
            </v-col>
            <v-col cols="12">
              <v-select
                v-model="form.requiredParticipantIds"
                label="Pflichtteilnehmer (z.B. DM)"
                :items="participantItems"
                prepend-inner-icon="mdi-shield-star"
                variant="outlined"
                density="comfortable"
                multiple
                chips
                closable-chips
                hint="Diese Personen müssen verfügbar sein, damit ein Termin bestätigt werden kann."
                persistent-hint
              >
                <template #chip="{ item, props: chipProps }">
                  <v-chip v-bind="chipProps" color="error" variant="tonal">
                    <v-icon start size="small">mdi-shield-star</v-icon>
                    {{ item.title }}
                  </v-chip>
                </template>
              </v-select>
            </v-col>

            <!-- Feature 4: Discord Channel ID -->
            <v-col cols="12">
              <v-text-field
                v-model="form.discordChannelId"
                label="Discord Channel ID (optional, überschreibt globale Einstellung)"
                prepend-inner-icon="mdi-discord"
                variant="outlined"
                density="comfortable"
                hint="Leer lassen um die globale Discord-Channel-Einstellung zu verwenden."
                persistent-hint
              />
            </v-col>

            <!-- Feature 3: Allowed Weekdays -->
            <v-col cols="12">
              <div class="text-body-2 mb-2">Erlaubte Wochentage (leer = alle erlaubt)</div>
              <v-btn-toggle
                v-model="form.allowedWeekdays"
                multiple
                variant="outlined"
                color="primary"
                density="comfortable"
              >
                <v-btn :value="1" size="small">Mo</v-btn>
                <v-btn :value="2" size="small">Di</v-btn>
                <v-btn :value="3" size="small">Mi</v-btn>
                <v-btn :value="4" size="small">Do</v-btn>
                <v-btn :value="5" size="small">Fr</v-btn>
                <v-btn :value="6" size="small">Sa</v-btn>
                <v-btn :value="0" size="small">So</v-btn>
              </v-btn-toggle>
            </v-col>

            <!-- Day Exceptions -->
            <v-col cols="12">
              <div class="text-body-2 mb-2">Ausnahme-Termine (immer erlaubt, auch wenn Wochentag gesperrt)</div>
              <div class="d-flex gap-2 align-center mb-2">
                <v-text-field
                  v-model="newException"
                  type="date"
                  label="Datum hinzufügen"
                  variant="outlined"
                  density="compact"
                  hide-details
                  style="max-width: 200px"
                />
                <v-btn size="small" color="primary" variant="tonal" @click="addException" :disabled="!newException">
                  <v-icon>mdi-plus</v-icon>
                </v-btn>
              </div>
              <div class="d-flex flex-wrap gap-1">
                <v-chip
                  v-for="ex in form.dayExceptions"
                  :key="ex"
                  closable
                  @click:close="removeException(ex)"
                  size="small"
                  color="info"
                  variant="tonal"
                >
                  {{ ex }}
                </v-chip>
              </div>
            </v-col>

            <!-- Feature 6: Reminders -->
            <v-col cols="12">
              <v-divider class="mb-3" />
              <div class="text-body-2 font-weight-medium mb-2">Erinnerungen</div>
            </v-col>
            <v-col cols="12" md="6">
              <v-switch
                v-model="form.reminderEnabled"
                label="Erinnerungen aktivieren"
                color="primary"
                hide-details
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-slider
                v-model="form.reminderDaysBefore"
                label="Tage vorher erinnern"
                :min="1"
                :max="7"
                :step="1"
                thumb-label
                color="warning"
                :disabled="!form.reminderEnabled"
              />
            </v-col>
          </v-row>
          <v-alert v-if="dialogError" type="error" variant="tonal" density="compact" class="mt-3">
            {{ dialogError }}
          </v-alert>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="tonal" @click="saveEvent" :loading="saving">
            {{ editingEvent ? 'Save Changes' : 'Create Event' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete confirm -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="pa-4">Delete Event</v-card-title>
        <v-card-text>
          Are you sure you want to delete <strong>{{ deletingEvent?.name }}</strong>? All availability data will be lost.
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="tonal" @click="deleteEvent" :loading="saving">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

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

interface UserType {
  id: string
  username: string
}

const loading = ref(false)
const error = ref('')
const events = ref<EventType[]>([])
const users = ref<UserType[]>([])
const dialog = ref(false)
const deleteDialog = ref(false)
const editingEvent = ref<EventType | null>(null)
const deletingEvent = ref<EventType | null>(null)
const saving = ref(false)
const dialogError = ref('')
const newException = ref('')

interface EventForm {
  name: string
  description: string
  type: 'recurring' | 'one-time'
  planningWindowWeeks: number
  minParticipants: number
  organizerId: string
  participantIds: string[]
  requiredParticipantIds: string[]
  notificationMethod: string
  allowedWeekdays: number[]
  dayExceptions: string[]
  discordChannelId: string
  reminderEnabled: boolean
  reminderDaysBefore: number
}

const defaultForm = (): EventForm => ({
  name: '',
  description: '',
  type: 'recurring',
  planningWindowWeeks: 4,
  minParticipants: 2,
  organizerId: '',
  participantIds: [],
  requiredParticipantIds: [],
  notificationMethod: 'none',
  allowedWeekdays: [],
  dayExceptions: [],
  discordChannelId: '',
  reminderEnabled: false,
  reminderDaysBefore: 1,
})

const form = ref<EventForm>(defaultForm())

const headers = [
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Type', key: 'type', sortable: true },
  { title: 'Participants', key: 'participantIds', sortable: false },
  { title: 'Min Players', key: 'minParticipants', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'center' as const },
]

const userItems = computed(() => users.value.map(u => ({ title: u.username, value: u.id })))
const participantItems = computed(() => {
  const ids = form.value.participantIds
  return users.value.filter(u => ids.includes(u.id)).map(u => ({ title: u.username, value: u.id }))
})

async function loadData() {
  loading.value = true
  try {
    const [eventsData, usersData] = await Promise.all([
      $fetch<EventType[]>('/api/events'),
      $fetch<UserType[]>('/api/users'),
    ])
    events.value = eventsData
    users.value = usersData
  } catch (e: unknown) {
    error.value = (e as { data?: { message?: string } }).data?.message || 'Failed to load data'
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

function getUserName(userId: string) {
  return users.value.find(u => u.id === userId)?.username || userId
}

function openAddDialog() {
  editingEvent.value = null
  form.value = defaultForm()
  newException.value = ''
  dialogError.value = ''
  dialog.value = true
}

function openEditDialog(event: EventType) {
  editingEvent.value = event
  form.value = {
    name: event.name,
    description: event.description,
    type: event.type,
    planningWindowWeeks: event.planningWindowWeeks,
    minParticipants: event.minParticipants,
    organizerId: event.organizerId,
    participantIds: [...event.participantIds],
    requiredParticipantIds: [...(event.requiredParticipantIds || [])],
    notificationMethod: event.notificationMethod,
    allowedWeekdays: [...(event.allowedWeekdays || [])],
    dayExceptions: [...(event.dayExceptions || [])],
    discordChannelId: event.discordChannelId || '',
    reminderEnabled: event.reminderEnabled ?? false,
    reminderDaysBefore: event.reminderDaysBefore ?? 1,
  }
  newException.value = ''
  dialogError.value = ''
  dialog.value = true
}

function addException() {
  if (newException.value && !form.value.dayExceptions.includes(newException.value)) {
    form.value.dayExceptions.push(newException.value)
    form.value.dayExceptions.sort()
    newException.value = ''
  }
}

function removeException(ex: string) {
  form.value.dayExceptions = form.value.dayExceptions.filter(e => e !== ex)
}

async function saveEvent() {
  saving.value = true
  dialogError.value = ''
  try {
    const payload = {
      ...form.value,
      discordChannelId: form.value.discordChannelId || undefined,
    }
    if (editingEvent.value) {
      await $fetch(`/api/events/${editingEvent.value.id}`, {
        method: 'PUT',
        body: payload,
      })
    } else {
      await $fetch('/api/events', {
        method: 'POST',
        body: payload,
      })
    }
    dialog.value = false
    await loadData()
  } catch (e: unknown) {
    dialogError.value = (e as { data?: { message?: string } }).data?.message || 'Operation failed'
  } finally {
    saving.value = false
  }
}

async function toggleArchive(event: EventType) {
  try {
    await $fetch(`/api/events/${event.id}`, {
      method: 'PUT',
      body: { archived: !event.archived },
    })
    await loadData()
  } catch (e: unknown) {
    error.value = (e as { data?: { message?: string } }).data?.message || 'Failed to archive event'
  }
}

function confirmDelete(event: EventType) {
  deletingEvent.value = event
  deleteDialog.value = true
}

async function deleteEvent() {
  if (!deletingEvent.value) return
  saving.value = true
  try {
    await $fetch(`/api/events/${deletingEvent.value.id}`, { method: 'DELETE' })
    deleteDialog.value = false
    await loadData()
  } catch (e: unknown) {
    error.value = (e as { data?: { message?: string } }).data?.message || 'Failed to delete event'
    deleteDialog.value = false
  } finally {
    saving.value = false
  }
}
</script>
