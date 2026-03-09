<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">User Management</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">Manage player accounts</p>
      </div>
      <v-btn color="primary" @click="openAddDialog">
        <v-icon start>mdi-account-plus</v-icon>
        Add User
      </v-btn>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4" closable @click:close="error = ''">
      {{ error }}
    </v-alert>

    <v-card rounded="lg">
      <v-data-table
        :headers="headers"
        :items="users"
        :loading="loading"
        item-value="id"
        hover
      >
        <template #item.username="{ item }">
          <div class="d-flex align-center gap-2">
            <UserAvatar :username="item.username" :size="32" />
            <span class="font-weight-medium">{{ item.username }}</span>
          </div>
        </template>
        <template #item.globalRole="{ item }">
          <v-chip :color="item.globalRole === 'admin' ? 'warning' : 'primary'" variant="tonal" size="small">
            <v-icon start size="small">{{ item.globalRole === 'admin' ? 'mdi-shield-crown' : 'mdi-account' }}</v-icon>
            {{ item.globalRole }}
          </v-chip>
        </template>
        <template #item.email="{ item }">
          <span class="text-medium-emphasis">{{ item.email || '—' }}</span>
        </template>
        <template #item.createdAt="{ item }">
          {{ new Date(item.createdAt).toLocaleDateString() }}
        </template>
        <template #item.actions="{ item }">
          <v-btn icon size="small" variant="text" @click="openEditDialog(item)" title="Edit">
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          <v-btn icon size="small" variant="text" color="error" @click="confirmDelete(item)" title="Delete">
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- Add/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="500">
      <v-card rounded="xl">
        <v-card-title class="pa-4">{{ editingUser ? 'Edit User' : 'Add User' }}</v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <v-text-field
            v-model="form.username"
            label="Username"
            prepend-inner-icon="mdi-account"
            variant="outlined"
            density="comfortable"
            class="mb-3"
            :readonly="!!editingUser"
          />
          <v-text-field
            v-if="!editingUser"
            v-model="form.password"
            label="Password"
            type="password"
            prepend-inner-icon="mdi-lock"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />
          <v-text-field
            v-model="form.email"
            label="Email"
            type="email"
            prepend-inner-icon="mdi-email"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />
          <v-select
            v-model="form.globalRole"
            label="Role"
            :items="[{ title: 'User', value: 'user' }, { title: 'Admin', value: 'admin' }]"
            prepend-inner-icon="mdi-shield"
            variant="outlined"
            density="comfortable"
          />
          <v-alert v-if="dialogError" type="error" variant="tonal" density="compact" class="mt-3">
            {{ dialogError }}
          </v-alert>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="tonal" @click="saveUser" :loading="saving">
            {{ editingUser ? 'Save Changes' : 'Create User' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete confirm -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="pa-4">Delete User</v-card-title>
        <v-card-text>
          Are you sure you want to delete <strong>{{ deletingUser?.username }}</strong>? This cannot be undone.
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="tonal" @click="deleteUser" :loading="saving">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'admin' })

interface UserType {
  id: string
  username: string
  email: string
  globalRole: 'admin' | 'user'
  createdAt: string
}

const loading = ref(false)
const error = ref('')
const users = ref<UserType[]>([])
const dialog = ref(false)
const deleteDialog = ref(false)
const editingUser = ref<UserType | null>(null)
const deletingUser = ref<UserType | null>(null)
const saving = ref(false)
const dialogError = ref('')

const form = ref({
  username: '',
  password: '',
  email: '',
  globalRole: 'user' as 'admin' | 'user',
})

const headers = [
  { title: 'Username', key: 'username', sortable: true },
  { title: 'Email', key: 'email', sortable: false },
  { title: 'Role', key: 'globalRole', sortable: true },
  { title: 'Created', key: 'createdAt', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'center' as const },
]

async function loadUsers() {
  loading.value = true
  try {
    users.value = await $fetch<UserType[]>('/api/users')
  } catch (e: unknown) {
    error.value = (e as { data?: { message?: string } }).data?.message || 'Failed to load users'
  } finally {
    loading.value = false
  }
}

onMounted(loadUsers)

function openAddDialog() {
  editingUser.value = null
  form.value = { username: '', password: '', email: '', globalRole: 'user' }
  dialogError.value = ''
  dialog.value = true
}

function openEditDialog(user: UserType) {
  editingUser.value = user
  form.value = { username: user.username, password: '', email: user.email, globalRole: user.globalRole }
  dialogError.value = ''
  dialog.value = true
}

async function saveUser() {
  saving.value = true
  dialogError.value = ''
  try {
    if (editingUser.value) {
      await $fetch(`/api/users/${editingUser.value.id}`, {
        method: 'PUT',
        body: { email: form.value.email, globalRole: form.value.globalRole, username: form.value.username },
      })
    } else {
      await $fetch('/api/users', {
        method: 'POST',
        body: form.value,
      })
    }
    dialog.value = false
    await loadUsers()
  } catch (e: unknown) {
    dialogError.value = (e as { data?: { message?: string } }).data?.message || 'Operation failed'
  } finally {
    saving.value = false
  }
}

function confirmDelete(user: UserType) {
  deletingUser.value = user
  deleteDialog.value = true
}

async function deleteUser() {
  if (!deletingUser.value) return
  saving.value = true
  try {
    await $fetch(`/api/users/${deletingUser.value.id}`, { method: 'DELETE' })
    deleteDialog.value = false
    await loadUsers()
  } catch (e: unknown) {
    error.value = (e as { data?: { message?: string } }).data?.message || 'Failed to delete user'
    deleteDialog.value = false
  } finally {
    saving.value = false
  }
}
</script>
