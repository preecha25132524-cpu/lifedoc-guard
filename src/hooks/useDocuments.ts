import { useCallback, useEffect, useMemo, useState } from 'react'
import type { DocumentDraft, DocumentItem } from '@/types'
import { loadDocuments, saveDocuments } from '@/lib/storage'
import { genId, withComputed } from '@/lib/utils'

export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentItem[]>(() => loadDocuments())
  const [now, setNow] = useState(() => new Date())

  // Recompute day-based status once per hour so long-open tabs stay accurate.
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000 * 60 * 60)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    saveDocuments(documents)
  }, [documents])

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
    return newDoc
  }, [])

  const updateDocument = useCallback((id: string, draft: DocumentDraft) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, ...draft, id, updatedAt: new Date().toISOString() } : d,
      ),
    )
  }, [])

  const deleteDocument = useCallback((id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id))
  }, [])

  const toggleFavorite = useCallback((id: string) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, favorite: !d.favorite } : d)),
    )
  }, [])

  const replaceAll = useCallback((docs: DocumentItem[]) => {
    setDocuments(docs)
  }, [])

  const mergeImported = useCallback((docs: DocumentItem[]) => {
    setDocuments((prev) => {
      const byId = new Map(prev.map((d) => [d.id, d]))
      for (const d of docs) byId.set(d.id, d)
      return Array.from(byId.values())
    })
  }, [])

  return {
    documents: computedDocuments,
    rawDocuments: documents,
    addDocument,
    updateDocument,
    deleteDocument,
    toggleFavorite,
    replaceAll,
    mergeImported,
  }
}
