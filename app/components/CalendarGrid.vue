<template>
  <div>
    <!-- Week navigation -->
    <div class="d-flex align-center mb-4 gap-2">
      <v-btn icon variant="tonal" @click="prevWeeks" :disabled="weekOffset <= 0">
        <v-icon>mdi-chevron-left</v-icon>
      </v-btn>
      <span class="text-body-1 font-weight-medium flex-grow-1 text-center">
        {{ formatDateRange() }}
      </span>
      <v-btn icon variant="tonal" @click="nextWeeks">
        <v-icon>mdi-chevron-right</v-icon>
      </v-btn>
    </div>

    <!-- Calendar grid -->
    <div class="calendar-grid">
      <!-- Day headers -->
      <div class="calendar-header">
        <div v-for="day in dayNames" :key="day" class="day-header text-caption text-medium-emphasis text-center">
          {{ day }}
        </div>
      </div>

      <!-- Weeks -->
      <div v-for="(week, wi) in visibleWeeks" :key="wi" class="calendar-week">
        <div
          v-for="day in week"
          :key="day.dateStr"
          class="calendar-day"
          :class="{
            'day-today': day.isToday,
            'day-past': day.isPast,
            'day-available': day.isCurrentUserAvailable,
            'day-qualified': day.meetsThreshold && !day.isConfirmed,
            'day-confirmed': day.isConfirmed,
            'day-clickable': !day.isPast,
          }"
          @click="!day.isPast && toggleAvailability(day.dateStr)"
        >
          <div class="day-number text-caption">{{ day.dayNum }}</div>
          <div class="day-month text-caption text-medium-emphasis" v-if="day.showMonth">{{ day.monthStr }}</div>

          <!-- Confirmed badge -->
          <v-icon v-if="day.isConfirmed" color="success" size="small" class="confirmed-icon">mdi-star</v-icon>

          <!-- Avatar stack -->
          <div class="avatar-stack" v-if="day.availableUsers.length > 0">
            <UserAvatar
              v-for="u in day.availableUsers.slice(0, 3)"
              :key="u.userId"
              :username="u.username"
              :size="20"
            />
            <span v-if="day.availableUsers.length > 3" class="text-caption more-count">
              +{{ day.availableUsers.length - 3 }}
            </span>
          </div>

          <!-- Count chip -->
          <v-chip
            v-if="day.availableUsers.length > 0"
            size="x-small"
            :color="day.meetsThreshold ? 'success' : 'secondary'"
            class="count-chip"
          >
            {{ day.availableUsers.length }}
          </v-chip>

          <!-- Required blocked indicator -->
          <v-icon
            v-if="day.requiredBlocked && day.availableUsers.length > 0 && !day.isPast"
            color="error"
            size="x-small"
            class="blocked-icon"
            title="Pflichtmitglied nicht verfügbar"
          >mdi-account-cancel</v-icon>

          <!-- Confirm button (organizer/admin only) -->
          <v-btn
            v-if="canConfirm && day.availableUsers.length > 0 && !day.isPast"
            size="x-small"
            :color="day.isConfirmed ? 'error' : 'success'"
            variant="tonal"
            class="confirm-btn"
            :disabled="!day.isConfirmed && day.requiredBlocked"
            :title="!day.isConfirmed && day.requiredBlocked ? 'Pflichtmitglied nicht verfügbar' : undefined"
            @click.stop="toggleConfirm(day.dateStr, day.isConfirmed)"
          >
            {{ day.isConfirmed ? 'Unconfirm' : 'Confirm' }}
          </v-btn>
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="d-flex flex-wrap gap-3 mt-4">
      <div class="d-flex align-center gap-1 text-caption">
        <div class="legend-box available-legend"></div>
        Du bist verfügbar
      </div>
      <div class="d-flex align-center gap-1 text-caption">
        <div class="legend-box qualified-legend"></div>
        Genug Teilnehmer (min. {{ minParticipants }})
      </div>
      <div class="d-flex align-center gap-1 text-caption">
        <div class="legend-box confirmed-legend"></div>
        Bestätigter Termin
      </div>
      <div v-if="requiredParticipantIds.length > 0" class="d-flex align-center gap-1 text-caption">
        <v-icon color="error" size="small">mdi-account-cancel</v-icon>
        Pflichtmitglied fehlt
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  eventId: string
  planningWindowWeeks: number
  minParticipants: number
  requiredParticipantIds: string[]
  canConfirm: boolean
  availabilities: Array<{ userId: string; username: string; dates: string[] }>
  confirmedDates: string[]
  currentUserId: string
}>()

const emit = defineEmits(['update:availabilities', 'confirm-date'])

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const weekOffset = ref(0)

function getStartDate(): Date {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay() + weekOffset.value * 7)
  return startOfWeek
}

const visibleWeeks = computed(() => {
  const start = getStartDate()
  const weeks = []
  const numWeeks = Math.min(props.planningWindowWeeks, 4) // Show 4 at a time

  for (let w = 0; w < numWeeks; w++) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(start)
      date.setDate(start.getDate() + w * 7 + d)
      const dateStr = formatDate(date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const availableUsers = props.availabilities.filter(a => a.dates.includes(dateStr))
      const isCurrentUserAvailable = availableUsers.some(a => a.userId === props.currentUserId)
      const isConfirmed = props.confirmedDates.includes(dateStr)
      const availableUserIds = availableUsers.map(a => a.userId)
      const requiredMissing = props.requiredParticipantIds.filter(id => !availableUserIds.includes(id))
      const requiredBlocked = requiredMissing.length > 0
      const meetsThreshold = !requiredBlocked && availableUsers.length >= props.minParticipants

      week.push({
        date,
        dateStr,
        dayNum: date.getDate(),
        monthStr: date.toLocaleString('default', { month: 'short' }),
        showMonth: date.getDate() === 1 || (w === 0 && d === 0),
        isToday: date.getTime() === today.getTime(),
        isPast: date < today,
        isCurrentUserAvailable,
        isConfirmed,
        meetsThreshold,
        requiredBlocked,
        availableUsers,
      })
    }
    weeks.push(week)
  }
  return weeks
})

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDateRange(): string {
  const start = getStartDate()
  const end = new Date(start)
  end.setDate(start.getDate() + Math.min(props.planningWindowWeeks, 4) * 7 - 1)
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
}

function prevWeeks() {
  if (weekOffset.value > 0) weekOffset.value -= Math.min(props.planningWindowWeeks, 4)
}

function nextWeeks() {
  weekOffset.value += Math.min(props.planningWindowWeeks, 4)
}

function toggleAvailability(dateStr: string) {
  emit('update:availabilities', dateStr)
}

function toggleConfirm(dateStr: string, isConfirmed: boolean) {
  emit('confirm-date', { date: dateStr, remove: isConfirmed })
}
</script>

<style scoped>
.calendar-grid {
  width: 100%;
}

.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 4px;
}

.day-header {
  padding: 4px;
  font-weight: 600;
}

.calendar-week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 4px;
}

.calendar-day {
  position: relative;
  min-height: 80px;
  padding: 6px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.2s;
  cursor: default;
}

.day-clickable {
  cursor: pointer;
}

.day-clickable:hover {
  background: rgba(124, 77, 255, 0.15);
  border-color: rgba(124, 77, 255, 0.4);
}

.day-today {
  border-color: rgba(68, 138, 255, 0.6);
  background: rgba(68, 138, 255, 0.08);
}

.day-past {
  opacity: 0.4;
  cursor: not-allowed;
}

.day-available {
  background: rgba(124, 77, 255, 0.2);
  border-color: rgba(124, 77, 255, 0.5);
}

.day-qualified {
  background: rgba(76, 175, 80, 0.15);
  border-color: rgba(76, 175, 80, 0.4);
}

.day-confirmed {
  background: rgba(76, 175, 80, 0.3);
  border-color: rgba(76, 175, 80, 0.7);
  box-shadow: 0 0 8px rgba(76, 175, 80, 0.3);
}

.day-number {
  font-weight: 600;
  font-size: 0.85rem;
}

.day-month {
  font-size: 0.7rem;
  margin-top: -2px;
}

.confirmed-icon {
  position: absolute;
  top: 4px;
  right: 4px;
}

.blocked-icon {
  position: absolute;
  top: 4px;
  right: 24px;
}

.avatar-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  margin-top: 4px;
}

.more-count {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.6);
}

.count-chip {
  margin-top: 2px;
}

.confirm-btn {
  margin-top: 4px;
  width: 100%;
}

.legend-box {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid rgba(255,255,255,0.2);
}

.available-legend {
  background: rgba(124, 77, 255, 0.3);
  border-color: rgba(124, 77, 255, 0.6);
}

.qualified-legend {
  background: rgba(76, 175, 80, 0.2);
  border-color: rgba(76, 175, 80, 0.5);
}

.confirmed-legend {
  background: rgba(76, 175, 80, 0.4);
  border-color: rgba(76, 175, 80, 0.8);
}
</style>
