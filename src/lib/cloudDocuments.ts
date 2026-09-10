import { supabase } from '@/lib/supabaseClient'
import type { DocumentItem } from '@/types'

/**
 * Cloud sync storage layer. Each row mirrors one DocumentItem: the id is the
 * primary key, and everything else lives in a single `data` jsonb column so
 * the schema never needs to change when DocumentItem gains fields.
 */
interface CloudRow {
  id: string
  data: Omit<DocumentItem, 'id'>
  updated_at: string
}

function rowToDoc(row: CloudRow): DocumentItem {
  return { ...row.data, id: row.id }
}

function docToRow(userId: string, doc: DocumentItem) {
  const { id, ...rest } = doc
  return {
    id,
    user_id: userId,
    data: rest,
    updated_at: doc.updatedAt || new Date().toISOString(),
  }
}

export async function fetchCloudDocuments(userId: string): Promise<DocumentItem[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('id, data, updated_at')
    .eq('user_id', userId)
  if (error) throw error
  return (data ?? []).map((row) => rowToDoc(row as CloudRow))
}

export async function upsertCloudDocument(userId: string, doc: DocumentItem) {
  const { error } = await supabase.from('documents').upsert(docToRow(userId, doc))
  if (error) throw error
}

export async function upsertCloudDocuments(userId: string, docs: DocumentItem[]) {
  if (docs.length === 0) return
  const rows = docs.map((doc) => docToRow(userId, doc))
  const { error } = await supabase.from('documents').upsert(rows)
  if (error) throw error
}

export async function deleteCloudDocument(id: string) {
  const { error } = await supabase.from('documents').delete().eq('id', id)
  if (error) throw error
}

/** Subscribes to realtime changes on this user's documents; returns an unsubscribe fn. */
export function subscribeCloudDocuments(userId: string, onChange: () => void) {
  const channel = supabase
    .channel(`documents-${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'documents', filter: `user_id=eq.${userId}` },
      () => onChange(),
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
