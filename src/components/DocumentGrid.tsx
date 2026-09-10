import { DocumentCard } from '@/components/DocumentCard'
import type { ComputedDoc, ReminderDays } from '@/types'

interface DocumentGridProps {
  documents: ComputedDoc[]
  onEdit: (doc: ComputedDoc) => void
  onDelete: (doc: ComputedDoc) => void
  onToggleFavorite: (doc: ComputedDoc) => void
  onSetReminder: (doc: ComputedDoc, days: ReminderDays) => void
}

export function DocumentGrid({
  documents,
  onEdit,
  onDelete,
  onToggleFavorite,
  onSetReminder,
}: DocumentGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {documents.map((doc) => (
        <DocumentCard
          key={doc.id}
          doc={doc}
          onEdit={() => onEdit(doc)}
          onDelete={() => onDelete(doc)}
          onToggleFavorite={() => onToggleFavorite(doc)}
          onSetReminder={(days) => onSetReminder(doc, days)}
        />
      ))}
    </div>
  )
}
