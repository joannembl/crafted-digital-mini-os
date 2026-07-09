import { isSupabaseConfigured, supabase } from './supabase'

export async function logAuditEvent({ workspaceId, action, entityType, entityId = null, metadata = {} }) {
  if (!isSupabaseConfigured || !workspaceId || !action || !entityType) return { error: null }

  try {
    const { data: userData } = await supabase.auth.getUser()
    const actorId = userData?.user?.id
    if (!actorId) return { error: null }

    const { error } = await supabase.from('audit_logs').insert({
      workspace_id: workspaceId,
      actor_id: actorId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
    })

    if (error) console.warn('Unable to write audit log:', error.message)
    return { error }
  } catch (error) {
    console.warn('Unable to write audit log:', error)
    return { error }
  }
}
