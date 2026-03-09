<template>
  <div>
    <AppBar />
    <v-main>
      <v-container class="py-6 px-4 px-md-8" style="max-width: 1400px;">
        <slot />
      </v-container>
    </v-main>
  </div>
</template>

<script setup lang="ts">
</script>
