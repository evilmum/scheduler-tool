<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">Settings</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">Configure notifications and integrations</p>
      </div>
      <v-btn color="primary" @click="saveSettings" :loading="saving">
        <v-icon start>mdi-content-save</v-icon>
        Save All Settings
      </v-btn>
    </div>

    <v-alert v-if="saveSuccess" type="success" variant="tonal" class="mb-4" closable @click:close="saveSuccess = false">
      Settings saved successfully!
    </v-alert>
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4" closable @click:close="error = ''">
      {{ error }}
    </v-alert>

    <div v-if="loading" class="d-flex justify-center py-8">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <template v-else>
      <NotificationSettings
        v-model="settings"
        :testing-discord="testingDiscord"
        :testing-email="testingEmail"
        @test-discord="testDiscord"
        @test-email="testEmail"
      />
    </template>

    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="4000" location="bottom right">
      {{ snackbarMessage }}
      <template #actions>
        <v-btn variant="text" @click="snackbar = false">Close</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

const loading = ref(true)
const saving = ref(false)
const saveSuccess = ref(false)
const error = ref('')
const testingDiscord = ref(false)
const testingEmail = ref(false)
const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

const settings = ref({
  discord: { token: '', channelId: '' },
  smtp: { host: '', port: 587, user: '', password: '', from: '' },
})

onMounted(async () => {
  try {
    const data = await $fetch<typeof settings.value>('/api/settings')
    settings.value = data
  } catch (e: unknown) {
    error.value = (e as { data?: { message?: string } }).data?.message || 'Failed to load settings'
  } finally {
    loading.value = false
  }
})

async function saveSettings() {
  saving.value = true
  error.value = ''
  saveSuccess.value = false
  try {
    await $fetch('/api/settings', {
      method: 'PUT',
      body: settings.value,
    })
    saveSuccess.value = true
    setTimeout(() => { saveSuccess.value = false }, 3000)
  } catch (e: unknown) {
    error.value = (e as { data?: { message?: string } }).data?.message || 'Failed to save settings'
  } finally {
    saving.value = false
  }
}

async function testDiscord() {
  testingDiscord.value = true
  try {
    await $fetch('/api/notifications/test', {
      method: 'POST',
      body: {
        type: 'discord',
        discord: {
          token: settings.value.discord.token,
          channelId: settings.value.discord.channelId,
        },
      },
    })
    showSnackbar('Discord Testnachricht erfolgreich gesendet!', 'success')
  } catch (e: unknown) {
    const msg = (e as { data?: { message?: string } }).data?.message || 'Discord Test fehlgeschlagen'
    showSnackbar(msg, 'error')
  } finally {
    testingDiscord.value = false
  }
}

async function testEmail(email: string) {
  testingEmail.value = true
  try {
    await $fetch('/api/notifications/test', {
      method: 'POST',
      body: { type: 'email', email },
    })
    showSnackbar(`Test email sent to ${email}!`, 'success')
  } catch (e: unknown) {
    showSnackbar((e as { data?: { message?: string } }).data?.message || 'Email test failed', 'error')
  } finally {
    testingEmail.value = false
  }
}

function showSnackbar(message: string, color: string) {
  snackbarMessage.value = message
  snackbarColor.value = color
  snackbar.value = true
}
</script>
