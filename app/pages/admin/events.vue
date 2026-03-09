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
    <v-dialog v-model="dialog" max-width="650" scrollable>
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

const defaultForm = () => ({
  name: '',
  description: '',
  type: 'recurring' as const,
  planningWindowWeeks: 4,
  minParticipants: 2,
  organizerId: '',
  participantIds: [] as string[],
  requiredParticipantIds: [] as string[],
  notificationMethod: 'none',
})

const form = ref(defaultForm())

const headers = [
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Type', key: 'type', sortable: true },
  { title: 'Participants', key: 'participantIds', sortable: false },
  { title: 'Min Players', key: 'minParticipants', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'center' as const },
]

const userItems = computed(() => users.value.map(u => ({ title: u.username, value: u.id })))
// Only allow selecting required participants from the already-chosen participants
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
  }
  dialogError.value = ''
  dialog.value = true
}

async function saveEvent() {
  saving.value = true
  dialogError.value = ''
  try {
    if (editingEvent.value) {
      await $fetch(`/api/events/${editingEvent.value.id}`, {
        method: 'PUT',
        body: form.value,
      })
    } else {
      await $fetch('/api/events', {
        method: 'POST',
        body: form.value,
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
