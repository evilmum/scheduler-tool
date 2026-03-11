<template>
  <v-dialog v-model="isOpen" max-width="480" scrollable>
    <v-card rounded="xl">
      <v-card-title class="pa-4">
        <v-icon start color="success">mdi-calendar-check</v-icon>
        Termin bestätigen
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-4">
        <div class="text-body-1 font-weight-medium mb-4">
          {{ formattedDate }}
        </div>
        <v-text-field
          v-model="form.location"
          label="Ort (optional)"
          prepend-inner-icon="mdi-map-marker"
          variant="outlined"
          density="comfortable"
          class="mb-3"
        />
        <v-row>
          <v-col cols="6">
            <v-text-field
              v-model="form.startTime"
              label="Beginn (optional)"
              type="time"
              prepend-inner-icon="mdi-clock-start"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="6">
            <v-text-field
              v-model="form.endTime"
              label="Ende (optional)"
              type="time"
              prepend-inner-icon="mdi-clock-end"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
        </v-row>
      </v-card-text>
      <v-divider />
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="isOpen = false">Abbrechen</v-btn>
        <v-btn color="success" variant="tonal" @click="save" :loading="saving">
          <v-icon start>mdi-check</v-icon>
          Bestätigen
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
  'confirm': [data: { date: string; location: string; startTime: string; endTime: string }]
}>()

const saving = ref(false)

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const form = ref({
  location: '',
  startTime: '',
  endTime: '',
})

const formattedDate = computed(() => {
  if (!props.date) return ''
  const d = new Date(props.date + 'T00:00:00')
  return d.toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
})

watch(() => props.modelValue, (v) => {
  if (v) {
    form.value = { location: '', startTime: '', endTime: '' }
  }
})

function save() {
  emit('confirm', {
    date: props.date,
    location: form.value.location,
    startTime: form.value.startTime,
    endTime: form.value.endTime,
  })
  isOpen.value = false
}
</script>
