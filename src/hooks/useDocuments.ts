import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { DocumentDraft, DocumentItem } from '@/types'
import { isDemoDocument, loadDocuments, saveDocuments } from '@/lib/storage'
import { genId, withComputed } from '@/lib/utils'
import {
  deleteCloudDocument,
  fetchCloudDocuments,
  subscribeCloudDocuments,
  upsertCloudDocument,
  upsertCloudDocuments,
} from '@/lib/cloudDocuments'

export type SyncState = 'idle' | 'syncing' | 'synced' | 'error'

/**
 * userId: pass a signed-in Supabase user id to turn on cross-device cloud
 * sync; pass null to stay fully local/offline (the original behavior).
 */
export function useDocuments(userId: string | null) {
  const [documents, setDocuments] = useState<DocumentItem[]>(() => loadDocuments())
  const [now, setNow] = useState(() => new Date())
  const [syncState, setSyncState] = useState<SyncState>('idle')

  // Refs mirror the latest state/props so callbacks created once (empty deps)
  // never read stale closures.
  const userIdRef = useRef(userId)
  useEffect(() => {
    userIdRef.current = userId
  }, [userId])

  const documentsRef = useRef(documents)
  useEffect(() => {
    documentsRef.current = documents
  }, [documents])

  // Recompute day-based status once per hour so long-open tabs stay accurate.
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000 * 60 * 60)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    saveDocuments(documents)
  }, [documents])

  // Initial cloud merge + realtime subscription whenever a user signs in.
  useEffect(() => {
    if (!userId) {
      setSyncState('idle')
      return
    }

    let cancelled = false

    async function initialSync(uid: string) {
      setSyncState('syncing')
      try {
        const cloudDocs = await fetchCloudDocuments(uid)

        if (cloudDocs.length === 0) {
          // First-ever cloud sync for this account (e.g. a brand-new
          // sign-up): migrate up only genuine local documents, never any
          // leftover demo/placeholder rows — a new account should always
          // start blank and be filled in by the person themselves.
          const localDocs = documentsRef.current.filter((d) => !isDemoDocument(d))
          if (localDocs.length > 0) await upsertCloudDocuments(uid, localDocs)
          if (!cancelled) {
            setDocuments(localDocs)
            setSyncState('synced')
          }
          return
        }

        // The cloud already holds this account's real data — this device is
        // joining an existing sync. Adopt the cloud as source of truth, but
        // still carry up any genuine local-only documents (real items added
        // offline before signing in). Untouched demo/placeholder documents
        // are never pushed, so a brand-new device doesn't pollute the
        // account with 12 sample entries.
        const localDocs = documentsRef.current
        const cloudById = new Map(cloudDocs.map((d) => [d.id, d]))
        const merged: DocumentItem[] = [...cloudDocs]
        const toPush: DocumentItem[] = []

        for (const local of localDocs) {
          if (cloudById.has(local.id)) continue
          if (isDemoDocument(local)) continue
          merged.push(local)
          toPush.push(local)
        }

        if (toPush.length > 0) await upsertCloudDocuments(uid, toPush)

        if (!cancelled) {
          setDocuments(merged)
          setSyncState('synced')
        }
      } catch (err) {
        console.error('ซิงก์ข้อมูลกับคลาวด์ล้มเหลว', err)
        if (!cancelled) setSyncState('error')
      }
    }

    initialSync(userId)

    const unsubscribe = subscribeCloudDocuments(userId, async () => {
      try {
        const cloudDocs = await fetchCloudDocuments(userIdRef.current ?? userId)
        if (!cancelled) setDocuments(cloudDocs)
      } catch (err) {
        console.error('รับข้อมูลอัปเดตจากคลาวด์ล้มเหลว', err)
      }
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [userId])

  const computedDocuments = useMemo(
    () => documents.map((d) => withComputed(d, now)),
    [documents, now],
  )

  const addDocument = useCallback((draft: DocumentDraft) => {
    const nowIso = new Date().toISOString()
    const newDoc: DocumentItem = {
      ...draft,
      id: genId(),
      createdAt: nowIso,
      updatedAt: nowIso,
    }
    setDocuments((prev) => [newDoc, ...prev])
    if (userIdRef.current) {
      upsertCloudDocument(userIdRef.current, newDoc).catch((err) =>
        console.error('บันทึกเอกสารขึ้นคลาวด์ล้มเหลว', err),
      )
    }
    return newDoc
  }, [])

  const updateDocument = useCallback((id: string, draft: DocumentDraft) => {
    const current = documentsRef.current.find((d) => d.id === id)
    if (!current) return
    const updated: DocumentItem = { ...current, ...draft, id, updatedAt: new Date().toISOString() }
    setDocuments((prev) => prev.map((d) => (d.id === id ? updated : d)))
    if (userIdRef.current) {
      upsertCloudDocument(userIdRef.current, updated).catch((err) =>
        console.error('อัปเดตเอกสารขึ้นคลาวด์ล้มเหลว', err),
      )
    }
  }, [])

  const deleteDocument = useCallback((id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id))
    if (userIdRef.current) {
      deleteCloudDocument(id).catch((err) =>
        console.error('ลบเอกสารออกจากคลาวด์ล้มเหลว', err),
      )
    }
  }, [])

  const toggleFavorite = useCallback((id: string) => {
    const current = documentsRef.current.find((d) => d.id === id)
    if (!current) return
    const updated: DocumentItem = {
      ...current,
      favorite: !current.favorite,
      updatedAt: new Date().toISOString(),
    }
    setDocuments((prev) => prev.map((d) => (d.id === id ? updated : d)))
    if (userIdRef.current) {
      upsertCloudDocument(userIdRef.current, updated).catch((err) =>
        console.error('อัปเดตเอกสารขึ้นคลาวด์ล้มเหลว', err),
      )
    }
  }, [])

  const replaceAll = useCallback((docs: DocumentItem[]) => {
    setDocuments(docs)
    if (userIdRef.current) {
      upsertCloudDocuments(userIdRef.current, docs).catch((err) =>
        console.error('ซิงก์ข้อมูลทั้งหมดขึ้นคลาวด์ล้มเหลว', err),
      )
    }
  }, [])

  const mergeImported = useCallback((docs: DocumentItem[]) => {
    let mergedDocs: DocumentItem[] = []
    setDocuments((prev) => {
      const byId = new Map(prev.map((d) => [d.id, d]))
      for (const d of docs) byId.set(d.id, d)
      mergedDocs = Array.from(byId.values())
      return mergedDocs
    })
    if (userIdRef.current) {
      upsertCloudDocuments(userIdRef.current, docs).catch((err) =>
        console.error('นำเข้าข้อมูลขึ้นคลาวด์ล้มเหลว', err),
      )
    }
  }, [])

  return {
    documents: computedDocuments,
    rawDocuments: documents,
    syncState,
    addDocument,
    updateDocument,
    deleteDocument,
    toggleFavorite,
    replaceAll,
    mergeImported,
  }
}
