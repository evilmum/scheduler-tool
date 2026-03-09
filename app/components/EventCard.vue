<template>
  <v-card
    :to="`/event/${event.id}`"
    :color="event.archived ? 'grey-darken-3' : 'surface'"
    hover
    rounded="lg"
  >
    <v-card-title class="d-flex align-center gap-2">
      <v-icon :color="event.archived ? 'grey' : 'primary'">
        {{ event.type === 'recurring' ? 'mdi-calendar-sync' : 'mdi-calendar-star' }}
      </v-icon>
      {{ event.name }}
      <v-chip v-if="event.archived" size="small" color="grey" class="ml-auto">Archived</v-chip>
      <v-chip v-else size="small" :color="event.type === 'recurring' ? 'primary' : 'accent'" class="ml-auto">
        {{ event.type === 'recurring' ? 'Recurring' : 'One-time' }}
      </v-chip>
    </v-card-title>
    <v-card-text>
      <p v-if="event.description" class="text-body-2 text-medium-emphasis mb-3">{{ event.description }}</p>
      <div class="d-flex gap-4 flex-wrap">
        <div class="d-flex align-center gap-1 text-body-2">
          <v-icon size="small" color="secondary">mdi-account-group</v-icon>
          <span>{{ event.participantIds.length }} participant{{ event.participantIds.length !== 1 ? 's' : '' }}</span>
        </div>
        <div class="d-flex align-center gap-1 text-body-2">
          <v-icon size="small" color="secondary">mdi-calendar-range</v-icon>
          <span>{{ event.planningWindowWeeks }} week{{ event.planningWindowWeeks !== 1 ? 's' : '' }} window</span>
        </div>
        <div class="d-flex align-center gap-1 text-body-2">
          <v-icon size="small" color="success">mdi-account-check</v-icon>
          <span>Min {{ event.minParticipants }} players</span>
        </div>
      </div>
    </v-card-text>
    <v-card-actions>
      <v-btn variant="tonal" color="primary" :to="`/event/${event.id}`">
        View Calendar
        <v-icon end>mdi-arrow-right</v-icon>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import type { DnDEvent } from '~/composables/useEvents'
defineProps<{ event: DnDEvent }>()
</script>
