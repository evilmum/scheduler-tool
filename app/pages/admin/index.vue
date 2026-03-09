<template>
  <div>
    <div class="mb-6">
      <h1 class="text-h4 font-weight-bold">Admin Dashboard</h1>
      <p class="text-body-2 text-medium-emphasis mt-1">System overview and quick actions</p>
    </div>

    <v-row>
      <v-col cols="12" sm="6" md="3">
        <v-card to="/admin/users" hover rounded="lg" color="primary" variant="tonal">
          <v-card-text class="text-center pa-5">
            <v-icon size="48" color="primary" class="mb-2">mdi-account-group</v-icon>
            <div class="text-h4 font-weight-bold">{{ userCount }}</div>
            <div class="text-body-2 text-medium-emphasis">Total Users</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card to="/admin/events" hover rounded="lg" color="secondary" variant="tonal">
          <v-card-text class="text-center pa-5">
            <v-icon size="48" color="secondary" class="mb-2">mdi-calendar-multiple</v-icon>
            <div class="text-h4 font-weight-bold">{{ eventCount }}</div>
            <div class="text-body-2 text-medium-emphasis">Total Events</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card to="/admin/events" hover rounded="lg" color="success" variant="tonal">
          <v-card-text class="text-center pa-5">
            <v-icon size="48" color="success" class="mb-2">mdi-calendar-check</v-icon>
            <div class="text-h4 font-weight-bold">{{ activeEventCount }}</div>
            <div class="text-body-2 text-medium-emphasis">Active Events</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card to="/admin/settings" hover rounded="lg" color="warning" variant="tonal">
          <v-card-text class="text-center pa-5">
            <v-icon size="48" color="warning" class="mb-2">mdi-cog</v-icon>
            <div class="text-h4 font-weight-bold">
              <v-icon :color="settingsConfigured ? 'success' : 'warning'">
                {{ settingsConfigured ? 'mdi-check-circle' : 'mdi-alert-circle' }}
              </v-icon>
            </div>
            <div class="text-body-2 text-medium-emphasis">Notifications</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-2">
      <v-col cols="12" md="6">
        <v-card rounded="lg">
          <v-card-title>
            <v-icon start color="primary">mdi-lightning-bolt</v-icon>
            Quick Actions
          </v-card-title>
          <v-list density="compact">
            <v-list-item
              prepend-icon="mdi-account-plus"
              title="Add New User"
              to="/admin/users"
              subtitle="Create a new player account"
              rounded="lg"
            />
            <v-list-item
              prepend-icon="mdi-calendar-plus"
              title="Create Event"
              to="/admin/events"
              subtitle="Set up a new campaign or session"
              rounded="lg"
            />
            <v-list-item
              prepend-icon="mdi-bell-cog"
              title="Configure Notifications"
              to="/admin/settings"
              subtitle="Set up Discord or email alerts"
              rounded="lg"
            />
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

const userCount = ref(0)
const eventCount = ref(0)
const activeEventCount = ref(0)
const settingsConfigured = ref(false)

onMounted(async () => {
  const [users, events, settings] = await Promise.all([
    $fetch<{ id: string }[]>('/api/users').catch(() => []),
    $fetch<{ id: string; archived: boolean }[]>('/api/events').catch(() => []),
    $fetch<{ discord: { token: string }; smtp: { host: string } }>('/api/settings').catch(() => null),
  ])
  userCount.value = users.length
  eventCount.value = events.length
  activeEventCount.value = events.filter(e => !e.archived).length
  settingsConfigured.value = !!(settings?.discord.token || settings?.smtp.host)
})
</script>
