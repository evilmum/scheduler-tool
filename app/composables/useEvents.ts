export interface DnDEvent {
  id: string
  name: string
  description: string
  type: 'recurring' | 'one-time'
  planningWindowWeeks: number
  minParticipants: number
  organizerId: string
  participantIds: string[]
  notificationMethod: 'discord' | 'email' | 'both' | 'none'
  createdAt: string
  archived: boolean
}

export function useEvents() {
  const events = ref<DnDEvent[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchEvents() {
    loading.value = true
    error.value = null
    try {
      events.value = await $fetch<DnDEvent[]>('/api/events')
    } catch (e: unknown) {
      error.value = (e as { message?: string }).message || 'Failed to load events'
    } finally {
      loading.value = false
    }
  }

  async function createEvent(data: Partial<DnDEvent>) {
    const newEvent = await $fetch<DnDEvent>('/api/events', {
      method: 'POST',
      body: data,
    })
    events.value.push(newEvent)
    return newEvent
  }

  async function updateEvent(id: string, data: Partial<DnDEvent>) {
    const updated = await $fetch<DnDEvent>(`/api/events/${id}`, {
      method: 'PUT',
      body: data,
    })
    const idx = events.value.findIndex(e => e.id === id)
    if (idx !== -1) events.value[idx] = updated
    return updated
  }

  async function deleteEvent(id: string) {
    await $fetch(`/api/events/${id}`, { method: 'DELETE' })
    events.value = events.value.filter(e => e.id !== id)
  }

  return {
    events,
    loading,
    error,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
  }
}
