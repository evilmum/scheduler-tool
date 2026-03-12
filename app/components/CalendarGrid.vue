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
            'day-available': day.isCurrentUserAvailable && !day.isCurrentUserMaybe,
            'day-maybe': day.isCurrentUserMaybe,
            'day-qualified': day.meetsThreshold && !day.isConfirmed && !day.isCancelled,
            'day-confirmed': day.isConfirmed && !day.isCancelled,
            'day-cancelled': day.isCancelled,
            'day-holiday': day.isHoliday,
            'day-blocked': day.isBlocked,
            'day-clickable': !day.isPast && !day.isBlocked,
          }"
          @click="!day.isPast && !day.isBlocked && toggleAvailability(day.dateStr)"
        >
          <div class="day-number text-caption">{{ day.dayNum }}</div>
          <div class="day-month text-caption text-medium-emphasis" v-if="day.showMonth">{{ day.monthStr }}</div>

          <!-- Holiday indicator -->
          <v-tooltip v-if="day.isHoliday" :text="day.holidayName" location="top">
            <template #activator="{ props: tProps }">
              <v-icon v-bind="tProps" color="amber-lighten-2" size="x-small" class="holiday-icon">mdi-church</v-icon>
            </template>
          </v-tooltip>

          <!-- Confirmed badge (not cancelled) -->
          <v-icon v-if="day.isConfirmed && !day.isCancelled" color="success" size="small" class="confirmed-icon">mdi-star</v-icon>

          <!-- Cancelled badge -->
          <v-icon v-if="day.isCancelled" color="grey" size="small" class="confirmed-icon">mdi-star-off</v-icon>

          <!-- Confirmed details (location / time) -->
          <div v-if="(day.isConfirmed || day.isCancelled) && day.confirmedEntry" class="confirmed-details text-caption">
            <span v-if="day.confirmedEntry.location" class="d-block text-truncate">
              <v-icon size="x-small" class="mr-1">mdi-map-marker</v-icon>{{ day.confirmedEntry.location }}
            </span>
            <span v-if="day.confirmedEntry.startTime" class="d-block">
              <v-icon size="x-small" class="mr-1">mdi-clock</v-icon>{{ day.confirmedEntry.startTime }}<template v-if="day.confirmedEntry.endTime"> – {{ day.confirmedEntry.endTime }}</template>
            </span>
            <span v-if="day.confirmedEntry.rescheduledFrom" class="d-block text-caption text-warning">
              Verschoben
            </span>
          </div>

          <!-- Avatar stack — yes users (green) -->
          <div class="avatar-stack" v-if="day.availableUsers.length > 0 || day.maybeUsers.length > 0">
            <UserAvatar
              v-for="u in day.availableUsers.slice(0, 3)"
              :key="u.userId"
              :username="u.username"
              :size="20"
            />
            <UserAvatar
              v-for="u in day.maybeUsers.slice(0, 2)"
              :key="'m-' + u.userId"
              :username="u.username"
              :size="20"
              style="opacity: 0.7; border: 1px solid rgb(var(--v-theme-warning));"
            />
            <span v-if="day.availableUsers.length + day.maybeUsers.length > 5" class="text-caption more-count">
              +{{ day.availableUsers.length + day.maybeUsers.length - 5 }}
            </span>
          </div>

          <!-- Count chips -->
          <div class="d-flex gap-1 flex-wrap" v-if="day.availableUsers.length > 0 || day.maybeUsers.length > 0">
            <v-chip
              v-if="day.availableUsers.length > 0"
              size="x-small"
              :color="day.meetsThreshold ? 'success' : 'secondary'"
              class="count-chip"
            >
              {{ day.availableUsers.length }}
            </v-chip>
            <v-chip
              v-if="day.maybeUsers.length > 0"
              size="x-small"
              color="warning"
              variant="tonal"
              class="count-chip"
            >
              ~{{ day.maybeUsers.length }}
            </v-chip>
          </div>

          <!-- Required blocked indicator -->
          <v-icon
            v-if="day.requiredBlocked && (day.availableUsers.length > 0 || day.maybeUsers.length > 0) && !day.isPast"
            color="error"
            size="x-small"
            class="blocked-icon"
            title="Pflichtmitglied nicht verfügbar"
          >mdi-account-cancel</v-icon>

          <!-- Confirm button (organizer/admin only) — for unconfirmed days -->
          <v-btn
            v-if="canConfirm && (day.availableUsers.length > 0 || day.maybeUsers.length > 0) && !day.isPast && !day.isConfirmed && !day.isBlocked"
            size="x-small"
            color="success"
            variant="tonal"
            class="confirm-btn"
            :disabled="day.requiredBlocked"
            :title="day.requiredBlocked ? 'Pflichtmitglied nicht verfügbar' : undefined"
            @click.stop="openConfirmDialog(day.dateStr)"
          >
            Confirm
          </v-btn>

          <!-- Cancel / Reschedule buttons for confirmed non-cancelled dates -->
          <template v-if="canConfirm && day.isConfirmed && !day.isCancelled && !day.isPast">
            <v-btn
              size="x-small"
              color="warning"
              variant="tonal"
              class="confirm-btn mt-1"
              @click.stop="openRescheduleDialog(day.dateStr)"
            >
              <v-icon size="x-small" start>mdi-calendar-sync</v-icon>
              Verschieben
            </v-btn>
            <v-btn
              size="x-small"
              color="error"
              variant="tonal"
              class="confirm-btn mt-1"
              @click.stop="cancelDate(day.dateStr)"
            >
              <v-icon size="x-small" start>mdi-cancel</v-icon>
              Absagen
            </v-btn>
          </template>

          <!-- Uncancel for cancelled dates -->
          <v-btn
            v-if="canConfirm && day.isCancelled && !day.isPast"
            size="x-small"
            color="secondary"
            variant="tonal"
            class="confirm-btn mt-1"
            @click.stop="openConfirmDialog(day.dateStr)"
          >
            Reaktivieren
          </v-btn>
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="d-flex flex-wrap gap-3 mt-4">
      <div class="d-flex align-center gap-1 text-caption">
        <div class="legend-box available-legend"></div>
        Ja (verfügbar)
      </div>
      <div class="d-flex align-center gap-1 text-caption">
        <div class="legend-box maybe-legend"></div>
        Vielleicht
      </div>
      <div class="d-flex align-center gap-1 text-caption">
        <div class="legend-box qualified-legend"></div>
        Genug Teilnehmer (min. {{ minParticipants }})
      </div>
      <div class="d-flex align-center gap-1 text-caption">
        <div class="legend-box confirmed-legend"></div>
        Bestätigter Termin
      </div>
      <div class="d-flex align-center gap-1 text-caption">
        <div class="legend-box cancelled-legend"></div>
        Abgesagt
      </div>
      <div class="d-flex align-center gap-1 text-caption">
        <div class="legend-box blocked-legend"></div>
        Nicht erlaubter Wochentag
      </div>
      <div class="d-flex align-center gap-1 text-caption">
        <v-icon color="amber-lighten-2" size="small">mdi-church</v-icon>
        Feiertag (NRW)
      </div>
      <div v-if="requiredParticipantIds.length > 0" class="d-flex align-center gap-1 text-caption">
        <v-icon color="error" size="small">mdi-account-cancel</v-icon>
        Pflichtmitglied fehlt
      </div>
    </div>

    <!-- Confirm Dialog -->
    <ConfirmDateDialog
      v-model="confirmDialogOpen"
      :date="confirmDialogDate"
      @confirm="handleConfirmDialogSave"
    />

    <!-- Reschedule Dialog -->
    <RescheduleDateDialog
      v-model="rescheduleDialogOpen"
      :date="rescheduleDialogDate"
      @reschedule="handleReschedule"
    />
  </div>
</template>

<script setup lang="ts">
interface ConfirmedDateEntry {
  date: string
  location: string
  startTime: string
  endTime: string
  cancelled: boolean
  rescheduledFrom: string | null
  rescheduledTo: string | null
}

interface AvailabilityEntry {
  userId: string
  username: string
  dates: string[]
  maybeDates: string[]
}

interface HolidayEntry {
  date: string
  name: string
}

const props = defineProps<{
  eventId: string
  planningWindowWeeks: number
  minParticipants: number
  requiredParticipantIds: string[]
  canConfirm: boolean
  availabilities: AvailabilityEntry[]
  confirmedDates: ConfirmedDateEntry[]
  currentUserId: string
  allowedWeekdays?: number[]
  dayExceptions?: string[]
}>()

const emit = defineEmits(['update:availabilities', 'confirm-date'])

const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
const weekOffset = ref(0)

// Confirm dialog state
const confirmDialogOpen = ref(false)
const confirmDialogDate = ref('')

// Reschedule dialog state
const rescheduleDialogOpen = ref(false)
const rescheduleDialogDate = ref('')

// Holidays
const { data: holidays } = useFetch<HolidayEntry[]>('/api/holidays')
const holidayMap = computed(() => {
  const map: Record<string, string> = {}
  for (const h of (holidays.value || [])) {
    map[h.date] = h.name
  }
  return map
})

function isDateBlocked(dateStr: string, dayOfWeek: number): boolean {
  const allowed = props.allowedWeekdays || []
  if (allowed.length === 0) return false
  const exceptions = props.dayExceptions || []
  if (exceptions.includes(dateStr)) return false
  return !allowed.includes(dayOfWeek)
}

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
  const numWeeks = Math.min(props.planningWindowWeeks, 4)

  for (let w = 0; w < numWeeks; w++) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(start)
      date.setDate(start.getDate() + w * 7 + d)
      const dateStr = formatDate(date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const availableUsers = props.availabilities.filter(a => a.dates.includes(dateStr))
      const maybeUsers = props.availabilities.filter(a => a.maybeDates?.includes(dateStr))
      const isCurrentUserAvailable = availableUsers.some(a => a.userId === props.currentUserId)
      const isCurrentUserMaybe = !isCurrentUserAvailable && maybeUsers.some(a => a.userId === props.currentUserId)

      const confirmedEntry = props.confirmedDates.find(c => c.date === dateStr)
      const isConfirmed = !!confirmedEntry
      const isCancelled = !!confirmedEntry?.cancelled

      const availableUserIds = availableUsers.map(a => a.userId)
      const requiredMissing = props.requiredParticipantIds.filter(id => !availableUserIds.includes(id))
      const requiredBlocked = requiredMissing.length > 0
      // meetsThreshold: yes + 0.5 * maybe >= minParticipants and required all have yes
      const effectiveCount = availableUsers.length + 0.5 * maybeUsers.filter(u => !availableUserIds.includes(u.userId)).length
      const meetsThreshold = !requiredBlocked && effectiveCount >= props.minParticipants

      const isBlocked = isDateBlocked(dateStr, date.getDay())
      const isHoliday = !!holidayMap.value[dateStr]
      const holidayName = holidayMap.value[dateStr] || ''

      week.push({
        date,
        dateStr,
        dayNum: date.getDate(),
        monthStr: date.toLocaleString('de-DE', { month: 'short' }),
        showMonth: date.getDate() === 1 || (w === 0 && d === 0),
        isToday: date.getTime() === today.getTime(),
        isPast: date < today,
        isCurrentUserAvailable,
        isCurrentUserMaybe,
        isConfirmed,
        isCancelled,
        confirmedEntry: confirmedEntry || null,
        meetsThreshold,
        requiredBlocked,
        availableUsers,
        maybeUsers: maybeUsers.filter(u => !availableUserIds.includes(u.userId)),
        isBlocked,
        isHoliday,
        holidayName,
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
  return `${start.toLocaleDateString('de-DE', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('de-DE', { month: 'short', day: 'numeric', year: 'numeric' })}`
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

function openConfirmDialog(dateStr: string) {
  confirmDialogDate.value = dateStr
  confirmDialogOpen.value = true
}

function openRescheduleDialog(dateStr: string) {
  rescheduleDialogDate.value = dateStr
  rescheduleDialogOpen.value = true
}

function handleConfirmDialogSave(data: { date: string; location: string; startTime: string; endTime: string }) {
  emit('confirm-date', { date: data.date, location: data.location, startTime: data.startTime, endTime: data.endTime })
}

function cancelDate(dateStr: string) {
  emit('confirm-date', { date: dateStr, cancel: true })
}

function handleReschedule(data: { oldDate: string; newDate: string }) {
  emit('confirm-date', { date: data.oldDate, reschedule: true, newDate: data.newDate })
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
  outline: none;
}

.calendar-day:focus,
.calendar-day:focus-visible {
  outline: none;
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

.day-maybe {
  background: rgba(255, 165, 0, 0.15);
  border-color: rgba(255, 165, 0, 0.4);
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

.day-cancelled {
  background: rgba(100, 100, 100, 0.15);
  border-color: rgba(150, 150, 150, 0.3);
  opacity: 0.7;
}

.day-holiday {
  border-color: rgba(255, 193, 7, 0.3);
}

.day-blocked {
  background: rgba(80, 80, 80, 0.08);
  border-color: rgba(120, 120, 120, 0.15);
  cursor: not-allowed;
  opacity: 0.5;
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

.holiday-icon {
  position: absolute;
  top: 4px;
  right: 24px;
}

.blocked-icon {
  position: absolute;
  top: 4px;
  right: 44px;
}

.confirmed-details {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 2px;
  max-width: 100%;
  overflow: hidden;
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
  font-size: 0.6rem;
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

.maybe-legend {
  background: rgba(255, 165, 0, 0.25);
  border-color: rgba(255, 165, 0, 0.5);
}

.qualified-legend {
  background: rgba(76, 175, 80, 0.2);
  border-color: rgba(76, 175, 80, 0.5);
}

.confirmed-legend {
  background: rgba(76, 175, 80, 0.4);
  border-color: rgba(76, 175, 80, 0.8);
}

.cancelled-legend {
  background: rgba(120, 120, 120, 0.2);
  border-color: rgba(150, 150, 150, 0.4);
}

.blocked-legend {
  background: rgba(80, 80, 80, 0.15);
  border-color: rgba(120, 120, 120, 0.25);
}
</style>
