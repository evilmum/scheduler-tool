<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="5" lg="4">
        <div class="text-center mb-6">
          <div class="text-h3 font-weight-bold text-primary mb-2">🎲</div>
          <div class="text-h5 font-weight-bold">DnD Scheduler</div>
          <div class="text-body-2 text-medium-emphasis mt-1">Organize your adventures</div>
        </div>
        <v-card rounded="xl" elevation="8">
          <v-card-text class="pa-6">
            <v-form @submit.prevent="handleLogin">
              <v-autocomplete
                v-model="username"
                :items="usernames"
                label="Username"
                prepend-inner-icon="mdi-account"
                variant="outlined"
                class="mb-3"
                autofocus
                auto-select-first
                :error-messages="error ? [error] : []"
                @update:model-value="error = ''"
              />
              <v-text-field
                v-model="password"
                label="Password"
                type="password"
                prepend-inner-icon="mdi-lock"
                variant="outlined"
                class="mb-4"
                :error-messages="error ? [''] : []"
                @input="error = ''"
              />
              <v-alert v-if="error" type="error" variant="tonal" class="mb-4" density="compact">
                {{ error }}
              </v-alert>
              <v-btn
                type="submit"
                color="primary"
                size="large"
                block
                :loading="loading"
              >
                <v-icon start>mdi-login</v-icon>
                Sign In
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const { loggedIn, login } = useAuth()
const router = useRouter()

if (loggedIn.value) {
  router.push('/dashboard')
}

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const { data: usernames } = await useFetch<string[]>('/api/auth/usernames')

async function handleLogin() {
  if (!username.value || !password.value) {
    error.value = 'Bitte Benutzername und Passwort eingeben'
    return
  }
  loading.value = true
  error.value = ''
  try {
    await login(username.value, password.value)
    router.push('/dashboard')
  } catch (e: unknown) {
    error.value = (e as { data?: { message?: string }; message?: string }).data?.message || (e as { message?: string }).message || 'Login fehlgeschlagen'
  } finally {
    loading.value = false
  }
}
</script>
