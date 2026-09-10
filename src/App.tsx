import { useMemo, useState } from 'react'
import { Header } from '@/components/Header'
import { SummaryCards } from '@/components/SummaryCards'
import { Toolbar, type StatusFilter } from '@/components/Toolbar'
import { DocumentGrid } from '@/components/DocumentGrid'
import { EmptyState } from '@/components/EmptyState'
import { DocumentFormDialog } from '@/components/DocumentFormDialog'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { SyncDialog } from '@/components/SyncDialog'
import { useAuth } from '@/hooks/useAuth'
import { useDocuments } from '@/hooks/useDocuments'
import { useNotifications } from '@/hooks/useNotifications'
import { useTheme } from '@/hooks/useTheme'
import { exportDocumentsToIcs } from '@/lib/ics'
import { buildBackup, downloadJson, parseBackup } from '@/lib/storage'
import { toDraft } from '@/lib/utils'
import type { CategoryId, ComputedDoc, DocumentDraft, ReminderDays, SortKey } from '@/types'

const STATUS_RANK: Record<ComputedDoc['status'], number> = {
  critical: 0,
  urgent: 1,
  expiring: 2,
  active: 3,
}

function App() {
  const { theme, toggleTheme } = useTheme()
  const auth = useAuth()
  const {
    documents,
    rawDocuments,
    syncState,
    addDocument,
    updateDocument,
    deleteDocument,
    toggleFavorite,
    mergeImported,
  } = useDocuments(auth.userId)
  const notifications = useNotifications(documents)

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<CategoryId | 'all'>('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<SortKey>('expiryAsc')

  const [formOpen, setFormOpen] = useState(false)
  const [editingDoc, setEditingDoc] = useState<ComputedDoc | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ComputedDoc | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [syncDialogOpen, setSyncDialogOpen] = useState(false)

  const filteredDocuments = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = documents.filter((d) => {
      if (category !== 'all' && d.category !== category) return false
      if (status === 'safe' && d.status !== 'active') return false
      if (status === 'expiring' && d.status !== 'expiring' && d.status !== 'urgent') return false
      if (status === 'expired' && d.status !== 'critical') return false
      if (q) {
        const haystack = `${d.title} ${d.issuer} ${d.documentNumber ?? ''} ${d.notes ?? ''}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })

    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'expiryAsc':
          return a.expiryDate.localeCompare(b.expiryDate)
        case 'expiryDesc':
          return b.expiryDate.localeCompare(a.expiryDate)
        case 'titleAsc':
          return a.title.localeCompare(b.title, 'th')
        case 'priority': {
          const rankDiff = STATUS_RANK[a.status] - STATUS_RANK[b.status]
          if (rankDiff !== 0) return rankDiff
          return a.daysRemaining - b.daysRemaining
        }
        default:
          return 0
      }
    })

    // Favorites float to the top within their sort bucket.
    return [...list].sort((a, b) => Number(!!b.favorite) - Number(!!a.favorite))
  }, [documents, search, category, status, sort])

  const hasActiveFilters = search.trim() !== '' || category !== 'all' || status !== 'all'

  function openAddDialog() {
    setEditingDoc(null)
    setFormOpen(true)
  }

  function openEditDialog(doc: ComputedDoc) {
    setEditingDoc(doc)
    setFormOpen(true)
  }

  function handleFormSubmit(draft: DocumentDraft) {
    if (editingDoc) {
      updateDocument(editingDoc.id, draft)
    } else {
      addDocument(draft)
    }
  }

  function handleExportJson() {
    downloadJson(
      `lifedoc-guard-backup-${new Date().toISOString().slice(0, 10)}.json`,
      buildBackup(rawDocuments),
    )
  }

  async function handleImportJson(file: File) {
    setImportError(null)
    const text = await file.text()
    const result = parseBackup(text)
    if (!result.ok || !result.documents) {
      setImportError(result.error ?? 'ไม่สามารถนำเข้าไฟล์ได้')
      return
    }
    mergeImported(result.documents)
  }

  function handleExportIcs() {
    exportDocumentsToIcs(rawDocuments)
  }

  return (
    <div className="min-h-screen pb-16">
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        notificationsSupported={notifications.supported}
        notificationsEnabled={notifications.enabled}
        notificationsPermission={notifications.permission}
        onEnableNotifications={notifications.enable}
        onDisableNotifications={notifications.disable}
        signedIn={auth.status === 'signedIn'}
        syncState={syncState}
        onOpenSync={() => setSyncDialogOpen(true)}
      />

      <main className="container space-y-6 pt-6">
        <SummaryCards documents={documents} />

        <Toolbar
          search={search}
          onSearchChange={setSearch}
          category={category}
          onCategoryChange={setCategory}
          status={status}
          onStatusChange={setStatus}
          sort={sort}
          onSortChange={setSort}
          onAddClick={openAddDialog}
          onExportJson={handleExportJson}
          onImportJson={handleImportJson}
          onExportIcs={handleExportIcs}
        />

        {importError && (
          <p className="rounded-lg border border-critical/30 bg-critical/10 px-3 py-2 text-xs text-critical">
            {importError}
          </p>
        )}

        {filteredDocuments.length > 0 ? (
          <DocumentGrid
            documents={filteredDocuments}
            onEdit={openEditDialog}
            onDelete={setDeleteTarget}
            onToggleFavorite={(doc) => toggleFavorite(doc.id)}
            onSetReminder={(doc, days: ReminderDays) =>
              updateDocument(doc.id, { ...toDraft(doc), reminderDays: days })
            }
          />
        ) : (
          <EmptyState
            hasFilters={hasActiveFilters}
            onAddClick={openAddDialog}
            onClearFilters={() => {
              setSearch('')
              setCategory('all')
              setStatus('all')
            }}
          />
        )}
      </main>

      <DocumentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editingDoc={editingDoc}
        onSubmit={handleFormSubmit}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="ลบเอกสารนี้?"
        description={
          deleteTarget
            ? `การลบ "${deleteTarget.title}" จะไม่สามารถกู้คืนได้ (แนะนำให้ส่งออกข้อมูลสำรองก่อนลบ)`
            : ''
        }
        confirmLabel="ลบเอกสาร"
        onConfirm={() => deleteTarget && deleteDocument(deleteTarget.id)}
      />

      <SyncDialog
        open={syncDialogOpen}
        onOpenChange={setSyncDialogOpen}
        status={auth.status}
        email={auth.email}
        syncState={syncState}
        onSignIn={auth.signIn}
        onSignUp={auth.signUp}
        onSignOut={auth.signOut}
      />
    </div>
  )
}

export default App
