<template>
  <div>
    <v-card class="mb-4" rounded="lg">
      <v-card-title>
        <v-icon start color="primary">mdi-discord</v-icon>
        Discord Settings
      </v-card-title>
      <v-card-text>
        <v-text-field
          v-model="form.discord.token"
          label="Bot Token"
          type="password"
          prepend-inner-icon="mdi-key"
          variant="outlined"
          density="comfortable"
          class="mb-3"
        />
        <v-text-field
          v-model="form.discord.channelId"
          label="Channel ID"
          prepend-inner-icon="mdi-pound"
          variant="outlined"
          density="comfortable"
        />
      </v-card-text>
      <v-card-actions>
        <v-btn color="success" variant="tonal" @click="$emit('save')">
          <v-icon start>mdi-content-save</v-icon>
          Speichern
        </v-btn>
        <v-btn color="primary" variant="tonal" @click="$emit('test-discord')" :loading="testingDiscord">
          <v-icon start>mdi-bell-ring</v-icon>
          Test Discord
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-card rounded="lg">
      <v-card-title>
        <v-icon start color="primary">mdi-email</v-icon>
        SMTP / Email Settings
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="8">
            <v-text-field
              v-model="form.smtp.host"
              label="SMTP Host"
              prepend-inner-icon="mdi-server"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model.number="form.smtp.port"
              label="Port"
              type="number"
              prepend-inner-icon="mdi-network"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.smtp.user"
              label="Username"
              prepend-inner-icon="mdi-account"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.smtp.password"
              label="Password"
              type="password"
              prepend-inner-icon="mdi-lock"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12">
            <v-text-field
              v-model="form.smtp.from"
              label="From Address"
              prepend-inner-icon="mdi-email-edit"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions class="flex-wrap gap-2">
        <v-btn color="success" variant="tonal" @click="$emit('save')">
          <v-icon start>mdi-content-save</v-icon>
          Speichern
        </v-btn>
        <v-text-field
          v-model="testEmailAddr"
          label="Test-E-Mail-Adresse"
          variant="outlined"
          density="compact"
          hide-details
          class="mr-2"
          style="max-width: 300px"
        />
        <v-btn color="primary" variant="tonal" @click="$emit('test-email', testEmailAddr)" :loading="testingEmail">
          <v-icon start>mdi-send</v-icon>
          Test E-Mail
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: {
    discord: { token: string; channelId: string }
    smtp: { host: string; port: number; user: string; password: string; from: string }
  }
  testingDiscord?: boolean
  testingEmail?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: typeof props.modelValue]
  'test-discord': []
  'test-email': [email: string]
  'save': []
}>()

const form = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const testEmailAddr = ref('')
</script>
