<template>
  <v-dialog v-model="isOpen" max-width="420">
    <v-card rounded="xl">
      <v-card-title class="pa-4">
        <v-icon start color="warning">mdi-calendar-sync</v-icon>
        Termin verschieben
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-4">
        <div class="text-body-2 text-medium-emphasis mb-3">
          Aktuelles Datum: <strong>{{ formattedDate }}</strong>
        </div>
        <v-text-field
          v-model="newDate"
          label="Neues Datum"
          type="date"
          prepend-inner-icon="mdi-calendar"
          variant="outlined"
          density="comfortable"
          :min="minDate"
        />
      </v-card-text>
      <v-divider />
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="isOpen = false">Abbrechen</v-btn>
        <v-btn color="warning" variant="tonal" @click="save" :disabled="!newDate">
          <v-icon start>mdi-calendar-arrow-right</v-icon>
          Verschieben
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  date: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'reschedule': [data: { oldDate: string; newDate: string }]
}>()

const newDate = ref('')

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const formattedDate = computed(() => {
  if (!props.date) return ''
  const d = new Date(props.date + 'T00:00:00')
  return d.toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
})

const minDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

watch(() => props.modelValue, (v) => {
  if (v) newDate.value = ''
})

function save() {
  if (!newDate.value) return
  emit('reschedule', { oldDate: props.date, newDate: newDate.value })
  isOpen.value = false
}
</script>
