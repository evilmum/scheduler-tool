<template>
  <v-tooltip :text="username" location="top">
    <template #activator="{ props }">
      <v-avatar
        v-bind="props"
        :color="color"
        :size="size"
      >
        <span class="text-caption font-weight-bold">{{ initials }}</span>
      </v-avatar>
    </template>
  </v-tooltip>
</template>

<script setup lang="ts">
const props = defineProps<{
  username: string
  size?: number | string
}>()

const avatarColors = [
  'primary', 'secondary', 'accent', 'success', 'info', 'warning',
  'deep-purple', 'indigo', 'cyan', 'teal', 'green', 'orange', 'red'
]

const initials = computed(() => {
  return props.username.slice(0, 2).toUpperCase()
})

const color = computed(() => {
  const idx = props.username.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % avatarColors.length
  return avatarColors[idx]
})
</script>
