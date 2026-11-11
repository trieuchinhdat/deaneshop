export type AdminEventType = 'NEW_ORDER' | 'NEW_LEAD' | 'ORDER_UPDATED' | 'LEAD_UPDATED'
export interface AdminEventPayload { type: AdminEventType; timestamp: string; data?: unknown }
// Compatibility for callers: database triggers atomically publish durable events.
// Do not publish a second process-local event or announce uncommitted data.
export function broadcastAdminEvent(_type: AdminEventType, _data?: unknown): void {}
