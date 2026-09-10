/**
 * Core domain types for LifeDoc Guard.
 * Enums are intentionally avoided (erasableSyntaxOnly) in favor of
 * string-literal unions + const lookup objects.
 */

export type CategoryId =
  | 'identity'
  | 'vehicle'
  | 'health'
  | 'financial'
  | 'professional'
  | 'digital'

export interface CategoryMeta {
  id: CategoryId
  label: string
  labelEn: string
  /** lucide-react icon name, resolved in a lookup map to keep this file icon-library agnostic */
  icon: string
  description: string
}

export const CATEGORIES: Record<CategoryId, CategoryMeta> = {
  identity: {
    id: 'identity',
    label: 'ระบุตัวตน & กฎหมาย',
    labelEn: 'Identity & Civil Status',
    icon: 'IdCard',
    description: 'เอกสารระบุตัวตนและสถานะทางกฎหมาย',
  },
  vehicle: {
    id: 'vehicle',
    label: 'ยานพาหนะ & การเดินทาง',
    labelEn: 'Vehicle & Driving',
    icon: 'Car',
    description: 'ใบขับขี่ ภาษี ประกันภัยรถ และการตรวจสภาพ',
  },
  health: {
    id: 'health',
    label: 'สุขภาพ & ประกันชีวิต',
    labelEn: 'Health & Insurance',
    icon: 'HeartPulse',
    description: 'กรมธรรม์และสิทธิการรักษาพยาบาล',
  },
  financial: {
    id: 'financial',
    label: 'การเงิน & ทรัพย์สิน',
    labelEn: 'Financial & Property',
    icon: 'Landmark',
    description: 'บัตร สัญญา และประกันทรัพย์สิน',
  },
  professional: {
    id: 'professional',
    label: 'วิชาชีพ & การศึกษา',
    labelEn: 'Professional & Certification',
    icon: 'GraduationCap',
    description: 'ใบประกอบวิชาชีพและใบรับรองความเชี่ยวชาญ',
  },
  digital: {
    id: 'digital',
    label: 'ดิจิทัล & สมาชิก',
    labelEn: 'Digital & Subscriptions',
    icon: 'Globe',
    description: 'โดเมน SSL และบริการสมาชิกรายปี',
  },
}

export const CATEGORY_ORDER: CategoryId[] = [
  'identity',
  'vehicle',
  'health',
  'financial',
  'professional',
  'digital',
]

export type DocumentStatus = 'active' | 'expiring' | 'urgent' | 'critical'

export const STATUS_META: Record<
  DocumentStatus,
  { label: string; colorVar: string; badgeClass: string; dotClass: string }
> = {
  active: {
    label: 'ปกติ',
    colorVar: 'success',
    badgeClass: 'bg-success/15 text-success border-success/30',
    dotClass: 'bg-success',
  },
  expiring: {
    label: 'ใกล้หมดอายุ',
    colorVar: 'warning',
    badgeClass: 'bg-warning/15 text-warning border-warning/30',
    dotClass: 'bg-warning',
  },
  urgent: {
    label: 'ด่วน',
    colorVar: 'warning',
    badgeClass: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    dotClass: 'bg-orange-500',
  },
  critical: {
    label: 'หมดอายุ/วิกฤต',
    colorVar: 'critical',
    badgeClass: 'bg-critical/15 text-critical border-critical/30',
    dotClass: 'bg-critical',
  },
}

/** Reminder lead time, in days before expiry, that the user wants to be notified. */
export type ReminderDays = 90 | 60 | 30 | 15 | 7

export interface DocumentItem {
  id: string
  title: string
  category: CategoryId
  /** lucide-react icon name override; falls back to the category icon when absent */
  icon?: string
  issuer: string
  documentNumber?: string
  /** Whether documentNumber should be masked by default in the UI */
  maskNumber: boolean
  issueDate: string | null
  expiryDate: string
  reminderDays: ReminderDays
  renewalMethod?: string
  renewalUrl?: string
  notes?: string
  attachmentDataUrl?: string
  attachmentName?: string
  favorite?: boolean
  createdAt: string
  updatedAt: string
}

export type SortKey = 'expiryAsc' | 'expiryDesc' | 'titleAsc' | 'priority'

export interface DocumentDraft
  extends Omit<
    DocumentItem,
    'id' | 'createdAt' | 'updatedAt' | 'maskNumber'
  > {
  maskNumber: boolean
}

export interface ComputedDoc extends DocumentItem {
  daysRemaining: number
  progressPct: number
  status: DocumentStatus
}
