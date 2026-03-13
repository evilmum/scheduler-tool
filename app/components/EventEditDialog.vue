<template>
  <v-dialog v-model="dialogOpen" max-width="700" scrollable>
    <v-card rounded="xl">
      <v-card-title class="pa-4">
        <v-icon start color="primary">mdi-calendar-edit</v-icon>
        {{ eventId ? 'Event bearbeiten' : 'Event erstellen' }}
      </v-card-title>
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

          <!-- Discord Channel ID -->
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

          <!-- Allowed Weekdays -->
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

          <!-- Reminders -->
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
        <v-btn variant="text" @click="dialogOpen = false">Abbrechen</v-btn>
        <v-btn color="primary" variant="tonal" @click="save" :loading="saving">
          {{ eventId ? 'Änderungen speichern' : 'Event erstellen' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
export interface EventFormData {
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

const props = defineProps<{
  modelValue: boolean
  eventId?: string
  initialData?: EventFormData
  users: { id: string; username: string }[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': []
}>()

const dialogOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const defaultForm = (): EventFormData => ({
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

const form = ref<EventFormData>(defaultForm())
const newException = ref('')
const saving = ref(false)
const dialogError = ref('')

// When the dialog opens, seed form from initialData (edit) or reset to defaults (create)
watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      form.value = props.initialData ? { ...props.initialData } : defaultForm()
      newException.value = ''
      dialogError.value = ''
    }
  },
)

const userItems = computed(() => props.users.map(u => ({ title: u.username, value: u.id })))

const participantItems = computed(() => {
  const ids = form.value.participantIds
  return props.users.filter(u => ids.includes(u.id)).map(u => ({ title: u.username, value: u.id }))
})

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

async function save() {
  saving.value = true
  dialogError.value = ''
  try {
    const payload = {
      ...form.value,
      discordChannelId: form.value.discordChannelId || undefined,
    }
    if (props.eventId) {
      await $fetch(`/api/events/${props.eventId}`, {
        method: 'PUT',
        body: payload,
      })
    } else {
      await $fetch('/api/events', {
        method: 'POST',
        body: payload,
      })
    }
    dialogOpen.value = false
    emit('saved')
  } catch (e: unknown) {
    dialogError.value = (e as { data?: { message?: string } }).data?.message || 'Operation failed'
  } finally {
    saving.value = false
  }
}
</script>
