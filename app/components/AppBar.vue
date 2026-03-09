<template>
  <v-app-bar color="surface" elevation="2" height="60">
    <!-- Home / Logo -->
    <v-btn
      variant="text"
      to="/dashboard"
      class="ml-2 px-3"
      rounded="lg"
    >
      <v-icon color="primary" size="24" class="mr-2">mdi-dice-d20</v-icon>
      <span class="text-body-1 font-weight-bold text-primary d-none d-sm-inline">DnD Scheduler</span>
    </v-btn>

    <v-spacer />

    <!-- Navigation buttons (right side) -->
    <div class="d-flex align-center gap-1 mr-2">
      <v-btn
        variant="text"
        to="/dashboard"
        rounded="lg"
        size="small"
        class="d-none d-md-flex"
      >
        <v-icon start>mdi-view-dashboard</v-icon>
        Dashboard
      </v-btn>

      <v-btn
        v-if="isAdmin"
        variant="tonal"
        color="warning"
        to="/admin"
        rounded="lg"
        size="small"
      >
        <v-icon start>mdi-shield-crown</v-icon>
        <span class="d-none d-sm-inline">Admin</span>
      </v-btn>

      <v-btn
        variant="text"
        to="/profile"
        rounded="lg"
        size="small"
      >
        <v-icon start>mdi-account-circle</v-icon>
        <span class="d-none d-sm-inline">{{ user?.username }}</span>
      </v-btn>

      <v-divider vertical class="mx-1" style="height:24px" />

      <v-btn
        icon
        variant="text"
        size="small"
        title="Logout"
        @click="logout"
      >
        <v-icon>mdi-logout</v-icon>
      </v-btn>
    </div>
  </v-app-bar>
</template>

<script setup lang="ts">
const { user, isAdmin, logout } = useAuth()
</script>
