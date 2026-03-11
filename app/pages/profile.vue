<template>
  <div>
    <div class="mb-6">
      <h1 class="text-h4 font-weight-bold">Profil</h1>
      <p class="text-body-2 text-medium-emphasis mt-1">Verwalte deine Kontoeinstellungen</p>
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
            E-Mail-Adresse
          </v-card-title>
          <v-card-text>
            <v-text-field
              v-model="email"
              label="E-Mail"
              type="email"
              prepend-inner-icon="mdi-email-outline"
              variant="outlined"
              density="comfortable"
              :placeholder="currentEmail || 'Nicht angegeben'"
            />
            <v-alert v-if="emailSuccess" type="success" variant="tonal" density="compact" class="mb-0">
              E-Mail erfolgreich aktualisiert!
            </v-alert>
            <v-alert v-if="emailError" type="error" variant="tonal" density="compact" class="mb-0">
              {{ emailError }}
            </v-alert>
          </v-card-text>
          <v-card-actions class="px-4 pb-4">
            <v-btn color="primary" variant="tonal" @click="updateEmail" :loading="savingEmail">
              <v-icon start>mdi-content-save</v-icon>
              E-Mail speichern
            </v-btn>
          </v-card-actions>
        </v-card>

        <!-- Change password -->
        <v-card rounded="lg" class="mb-4">
          <v-card-title>
            <v-icon start color="primary">mdi-lock-reset</v-icon>
            Passwort ändern
          </v-card-title>
          <v-card-text>
            <v-text-field
              v-model="currentPassword"
              label="Aktuelles Passwort"
              type="password"
              prepend-inner-icon="mdi-lock"
              variant="outlined"
              density="comfortable"
              class="mb-3"
            />
            <v-text-field
              v-model="newPassword"
              label="Neues Passwort"
              type="password"
              prepend-inner-icon="mdi-lock-plus"
              variant="outlined"
              density="comfortable"
              class="mb-3"
              hint="Mindestens 6 Zeichen"
            />
            <v-text-field
              v-model="confirmPassword"
              label="Neues Passwort bestätigen"
              type="password"
              prepend-inner-icon="mdi-lock-check"
              variant="outlined"
              density="comfortable"
              :error-messages="passwordMismatch ? ['Passwörter stimmen nicht überein'] : []"
            />
            <v-alert v-if="pwSuccess" type="success" variant="tonal" density="compact" class="mt-3">
              Passwort erfolgreich geändert!
            </v-alert>
            <v-alert v-if="pwError" type="error" variant="tonal" density="compact" class="mt-3">
              {{ pwError }}
            </v-alert>
          </v-card-text>
          <v-card-actions class="px-4 pb-4">
            <v-btn color="primary" variant="tonal" @click="changePassword" :loading="savingPassword" :disabled="!!passwordMismatch">
              <v-icon start>mdi-key-change</v-icon>
              Passwort ändern
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- Feature 8: Absences section -->
      <v-col cols="12">
        <v-card rounded="lg">
          <v-card-title>
            <v-icon start color="warning">mdi-account-off</v-icon>
            Meine Abwesenheiten
          </v-card-title>
          <v-card-text>
            <!-- Add absence form -->
            <div class="text-body-2 font-weight-medium mb-3">Abwesenheit hinzufügen</div>
            <v-row>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model="newAbsence.start"
                  label="Von"
                  type="date"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-calendar-start"
                />
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model="newAbsence.end"
                  label="Bis"
                  type="date"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-calendar-end"
                  :min="newAbsence.start"
                />
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model="newAbsence.note"
                  label="Notiz (optional)"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-note-text"
                  placeholder="z.B. Urlaub"
                />
              </v-col>
            </v-row>
            <v-btn
              color="warning"
              variant="tonal"
              @click="addAbsence"
              :loading="savingAbsence"
              :disabled="!newAbsence.start || !newAbsence.end"
              class="mb-4"
            >
              <v-icon start>mdi-plus</v-icon>
              Abwesenheit eintragen
            </v-btn>

            <v-alert v-if="absenceError" type="error" variant="tonal" density="compact" class="mb-3">
              {{ absenceError }}
            </v-alert>

            <!-- Absence list -->
            <div v-if="absences.length === 0" class="text-medium-emphasis text-body-2">
              Keine Abwesenheiten eingetragen.
            </div>
            <v-list v-else density="compact">
              <v-list-item
                v-for="absence in absences"
                :key="absence.id"
                rounded="lg"
                class="mb-1"
              >
                <template #prepend>
                  <v-icon color="warning" size="small">mdi-calendar-remove</v-icon>
                </template>
                <v-list-item-title>
                  {{ formatDate(absence.start) }} – {{ formatDate(absence.end) }}
                  <span v-if="absence.note" class="text-medium-emphasis text-caption ml-2">({{ absence.note }})</span>
                </v-list-item-title>
                <template #append>
                  <v-btn
                    icon
                    size="small"
                    variant="text"
                    color="error"
                    @click="deleteAbsence(absence.id)"
                    title="Löschen"
                  >
                    <v-icon size="small">mdi-delete</v-icon>
                  </v-btn>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const { user } = useAuth()

interface Absence {
  id: string
  start: string
  end: string
  note: string
}

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

// Absences
const absences = ref<Absence[]>([])
const savingAbsence = ref(false)
const absenceError = ref('')
const newAbsence = ref({ start: '', end: '', note: '' })

onMounted(async () => {
  if (user.value) {
    try {
      const userData = await $fetch<{ email: string }>(`/api/users/${user.value.id}`)
      currentEmail.value = userData.email || ''
      email.value = userData.email || ''
    } catch {}
    await loadAbsences()
  }
})

async function loadAbsences() {
  try {
    absences.value = await $fetch<Absence[]>('/api/absences')
  } catch {
    absences.value = []
  }
}

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
    emailError.value = (e as { data?: { message?: string } }).data?.message || 'E-Mail konnte nicht aktualisiert werden'
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
    pwError.value = (e as { data?: { message?: string } }).data?.message || 'Passwort konnte nicht geändert werden'
  } finally {
    savingPassword.value = false
  }
}

async function addAbsence() {
  if (!newAbsence.value.start || !newAbsence.value.end) return
  savingAbsence.value = true
  absenceError.value = ''
  try {
    await $fetch('/api/absences', {
      method: 'POST',
      body: {
        start: newAbsence.value.start,
        end: newAbsence.value.end,
        note: newAbsence.value.note,
      },
    })
    newAbsence.value = { start: '', end: '', note: '' }
    await loadAbsences()
  } catch (e: unknown) {
    absenceError.value = (e as { data?: { message?: string } }).data?.message || 'Abwesenheit konnte nicht gespeichert werden'
  } finally {
    savingAbsence.value = false
  }
}

async function deleteAbsence(id: string) {
  try {
    await $fetch(`/api/absences/${id}`, { method: 'DELETE' })
    await loadAbsences()
  } catch (e: unknown) {
    absenceError.value = (e as { data?: { message?: string } }).data?.message || 'Abwesenheit konnte nicht gelöscht werden'
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>
