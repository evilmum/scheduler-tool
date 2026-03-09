<template>
  <div>
    <div class="mb-6">
      <h1 class="text-h4 font-weight-bold">Profile</h1>
      <p class="text-body-2 text-medium-emphasis mt-1">Manage your account settings</p>
    </div>

    <v-row>
      <!-- User info card -->
      <v-col cols="12" md="5">
        <v-card rounded="lg" class="mb-4">
          <v-card-text class="text-center pa-6">
            <UserAvatar :username="user?.username || ''" :size="72" class="mb-3" />
            <h2 class="text-h6 font-weight-bold">{{ user?.username }}</h2>
            <v-chip :color="user?.globalRole === 'admin' ? 'warning' : 'primary'" variant="tonal" size="small" class="mt-1">
              <v-icon start size="small">{{ user?.globalRole === 'admin' ? 'mdi-shield-crown' : 'mdi-account' }}</v-icon>
              {{ user?.globalRole === 'admin' ? 'Administrator' : 'User' }}
            </v-chip>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Email & Password -->
      <v-col cols="12" md="7">
        <!-- Email -->
        <v-card rounded="lg" class="mb-4">
          <v-card-title>
            <v-icon start color="primary">mdi-email</v-icon>
            Email Address
          </v-card-title>
          <v-card-text>
            <v-text-field
              v-model="email"
              label="Email"
              type="email"
              prepend-inner-icon="mdi-email-outline"
              variant="outlined"
              density="comfortable"
              :placeholder="currentEmail || 'Not set'"
            />
            <v-alert v-if="emailSuccess" type="success" variant="tonal" density="compact" class="mb-0">
              Email updated successfully!
            </v-alert>
            <v-alert v-if="emailError" type="error" variant="tonal" density="compact" class="mb-0">
              {{ emailError }}
            </v-alert>
          </v-card-text>
          <v-card-actions class="px-4 pb-4">
            <v-btn color="primary" variant="tonal" @click="updateEmail" :loading="savingEmail">
              <v-icon start>mdi-content-save</v-icon>
              Save Email
            </v-btn>
          </v-card-actions>
        </v-card>

        <!-- Change password -->
        <v-card rounded="lg">
          <v-card-title>
            <v-icon start color="primary">mdi-lock-reset</v-icon>
            Change Password
          </v-card-title>
          <v-card-text>
            <v-text-field
              v-model="currentPassword"
              label="Current Password"
              type="password"
              prepend-inner-icon="mdi-lock"
              variant="outlined"
              density="comfortable"
              class="mb-3"
            />
            <v-text-field
              v-model="newPassword"
              label="New Password"
              type="password"
              prepend-inner-icon="mdi-lock-plus"
              variant="outlined"
              density="comfortable"
              class="mb-3"
              hint="Minimum 6 characters"
            />
            <v-text-field
              v-model="confirmPassword"
              label="Confirm New Password"
              type="password"
              prepend-inner-icon="mdi-lock-check"
              variant="outlined"
              density="comfortable"
              :error-messages="passwordMismatch ? ['Passwords do not match'] : []"
            />
            <v-alert v-if="pwSuccess" type="success" variant="tonal" density="compact" class="mt-3">
              Password changed successfully!
            </v-alert>
            <v-alert v-if="pwError" type="error" variant="tonal" density="compact" class="mt-3">
              {{ pwError }}
            </v-alert>
          </v-card-text>
          <v-card-actions class="px-4 pb-4">
            <v-btn color="primary" variant="tonal" @click="changePassword" :loading="savingPassword" :disabled="passwordMismatch">
              <v-icon start>mdi-key-change</v-icon>
              Change Password
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const { user } = useAuth()

const email = ref('')
const currentEmail = ref('')
const savingEmail = ref(false)
const emailSuccess = ref(false)
const emailError = ref('')

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const savingPassword = ref(false)
const pwSuccess = ref(false)
const pwError = ref('')

const passwordMismatch = computed(() => confirmPassword.value && newPassword.value !== confirmPassword.value)

onMounted(async () => {
  if (user.value) {
    try {
      const userData = await $fetch<{ email: string }>(`/api/users/${user.value.id}`)
      currentEmail.value = userData.email || ''
      email.value = userData.email || ''
    } catch {}
  }
})

async function updateEmail() {
  savingEmail.value = true
  emailSuccess.value = false
  emailError.value = ''
  try {
    await $fetch(`/api/users/${user.value?.id}`, {
      method: 'PUT',
      body: { email: email.value },
    })
    currentEmail.value = email.value
    emailSuccess.value = true
    setTimeout(() => { emailSuccess.value = false }, 3000)
  } catch (e: unknown) {
    emailError.value = (e as { data?: { message?: string } }).data?.message || 'Failed to update email'
  } finally {
    savingEmail.value = false
  }
}

async function changePassword() {
  if (passwordMismatch.value) return
  savingPassword.value = true
  pwSuccess.value = false
  pwError.value = ''
  try {
    await $fetch(`/api/users/${user.value?.id}/change-password`, {
      method: 'POST',
      body: {
        currentPassword: currentPassword.value,
        newPassword: newPassword.value,
      },
    })
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    pwSuccess.value = true
    setTimeout(() => { pwSuccess.value = false }, 3000)
  } catch (e: unknown) {
    pwError.value = (e as { data?: { message?: string } }).data?.message || 'Failed to change password'
  } finally {
    savingPassword.value = false
  }
}
</script>
