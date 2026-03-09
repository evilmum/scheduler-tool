<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">Dashboard</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">Your upcoming campaigns and sessions</p>
      </div>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4" closable>
      {{ error }}
    </v-alert>

    <div v-if="loading" class="d-flex justify-center py-8">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <template v-else>
      <div v-if="activeEvents.length === 0" class="text-center py-12">
        <v-icon size="64" color="primary" class="mb-4">mdi-calendar-blank</v-icon>
        <h3 class="text-h6 text-medium-emphasis">No events yet</h3>
        <p class="text-body-2 text-medium-emphasis mt-1">
          {{ isAdmin ? 'Create events in the Admin area.' : 'Ask your DM to add you to an event.' }}
        </p>
        <v-btn v-if="isAdmin" color="primary" to="/admin/events" class="mt-4">
          <v-icon start>mdi-plus</v-icon>
          Create Event
        </v-btn>
      </div>

      <div v-else>
        <h2 class="text-h6 mb-3">Active Campaigns ({{ activeEvents.length }})</h2>
        <v-row>
          <v-col v-for="event in activeEvents" :key="event.id" cols="12" md="6" lg="4">
            <EventCard :event="event" />
          </v-col>
        </v-row>

        <template v-if="archivedEvents.length > 0">
          <h2 class="text-h6 mb-3 mt-6">Archived ({{ archivedEvents.length }})</h2>
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

const { isAdmin } = useAuth()
const { events, loading, error, fetchEvents } = useEvents()

await fetchEvents()

const activeEvents = computed(() => events.value.filter(e => !e.archived))
const archivedEvents = computed(() => events.value.filter(e => e.archived))
</script>
