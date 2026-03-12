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
    <EventEditDialog
      v-model="dialog"
      :event-id="editingEvent?.id"
      :initial-data="editFormData"
      :users="users"
      @saved="loadData"
    />

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

interface EventFormData {
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

const loading = ref(false)
const error = ref('')
const events = ref<EventType[]>([])
const users = ref<UserType[]>([])
const dialog = ref(false)
const deleteDialog = ref(false)
const editingEvent = ref<EventType | null>(null)
const deletingEvent = ref<EventType | null>(null)
const saving = ref(false)
const editFormData = ref<EventFormData | undefined>(undefined)

const headers = [
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Type', key: 'type', sortable: true },
  { title: 'Participants', key: 'participantIds', sortable: false },
  { title: 'Min Players', key: 'minParticipants', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'center' as const },
]

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
  editFormData.value = undefined
  dialog.value = true
}

function openEditDialog(event: EventType) {
  editingEvent.value = event
  editFormData.value = {
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
  dialog.value = true
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
