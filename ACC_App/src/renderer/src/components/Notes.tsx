import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CheckCircle2, Circle, Plus, Tag, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore'
import { DONE_CATEGORY_ID } from '../store/useStore'

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace('#', '').trim()
  const normalized =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw

  if (normalized.length !== 6) return `rgba(255,255,255,${alpha})`
  const r = parseInt(normalized.slice(0, 2), 16)
  const g = parseInt(normalized.slice(2, 4), 16)
  const b = parseInt(normalized.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function NoteCard({
  id,
  title,
  content,
  color,
  categoryNames,
  isDone,
  onToggleDone,
  onContextMenu,
  onOpen
}: {
  id: string
  title: string
  content: string
  color: string
  categoryNames: string[]
  isDone: boolean
  onToggleDone: () => void
  onContextMenu: (e: React.MouseEvent) => void
  onOpen: () => void
}): React.JSX.Element {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <button
      ref={setNodeRef}
      style={{
        ...style,
        backgroundColor: hexToRgba(color, 0.18)
      }}
      type="button"
      onClick={onOpen}
      onContextMenu={onContextMenu}
      className="text-left rounded-2xl border border-black/10 dark:border-white/5 p-4 hover:shadow-[0_0_24px_rgba(0,0,0,0.10)] dark:hover:shadow-[0_0_24px_rgba(255,255,255,0.08)] transition"
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggleDone()
          }}
          className="w-10 h-10 rounded-xl border border-black/10 dark:border-white/10 shrink-0 bg-white/40 dark:bg-black/25 flex items-center justify-center"
          title={t('notes.toggleDone')}
          aria-label={t('notes.toggleDone')}
        >
          {isDone ? (
            <CheckCircle2 size={18} className="text-emerald-600" />
          ) : (
            <Circle size={18} className="text-black/35 dark:text-white/40" />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-black/90 dark:text-white truncate">
              {title || t('notes.untitled')}
            </div>
          </div>
          <div className="mt-1 text-xs text-black/50 dark:text-white/35">
            <div className="max-h-9 overflow-hidden">
              {content?.trim() ? content : t('notes.contentPlaceholder')}
            </div>
          </div>
          {categoryNames.length > 0 ? (
            <div className="mt-3 flex items-center gap-1 text-[11px] text-black/50 dark:text-white/40">
              <Tag size={12} />
              <span className="truncate">{categoryNames.join(', ')}</span>
            </div>
          ) : null}
        </div>
      </div>
    </button>
  )
}

function ModalShell({
  open,
  children,
  onClose,
  className
}: {
  open: boolean
  children: React.ReactNode
  onClose: () => void
  className: string
}): React.JSX.Element | null {
  const { t } = useTranslation()
  if (!open) return null
  return (
    <div className="absolute inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label={t('common.close')}
      />
      <div className="absolute inset-0 p-6 md:p-10">
        <div
          className={[
            'h-full w-full max-w-4xl mx-auto rounded-3xl shadow-2xl overflow-hidden border',
            className
          ].join(' ')}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export default function Notes(): React.JSX.Element {
  const { t } = useTranslation()
  const theme = useStore((s) => s.theme)
  const notes = useStore((s) => s.notes)
  const noteCategories = useStore((s) => s.noteCategories)
  const addNote = useStore((s) => s.addNote)
  const updateNote = useStore((s) => s.updateNote)
  const toggleNoteCategory = useStore((s) => s.toggleNoteCategory)
  const deleteNote = useStore((s) => s.deleteNote)
  const reorderNotes = useStore((s) => s.reorderNotes)
  const applyNotesUpdate = useStore((s) => s.applyNotesUpdate)
  const addNoteCategory = useStore((s) => s.addNoteCategory)
  const deleteNoteCategory = useStore((s) => s.deleteNoteCategory)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const [activeFilterIds, setActiveFilterIds] = useState<string[]>([])
  const [openNoteId, setOpenNoteId] = useState<string | null>(null)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#0ea5e9')
  const [menu, setMenu] = useState<{ open: boolean; id: string | null; x: number; y: number }>({
    open: false,
    id: null,
    x: 0,
    y: 0
  })

  useEffect(() => {
    // If a selected filter category was deleted, drop it from selection.
    const allowed = new Set(noteCategories.map((c) => c.id))
    setActiveFilterIds((prev) => prev.filter((id) => allowed.has(id)))
  }, [noteCategories])

  useEffect(() => {
    if (!menu.open) return
    const close = (): void => setMenu({ open: false, id: null, x: 0, y: 0 })
    window.addEventListener('mousedown', close)
    return () => window.removeEventListener('mousedown', close)
  }, [menu.open])

  useEffect(() => {
    if (!openNoteId && !categoryModalOpen) return
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      // Close the top-most modal first.
      if (categoryModalOpen) {
        setCategoryModalOpen(false)
        return
      }
      if (openNoteId) setOpenNoteId(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [openNoteId, categoryModalOpen])

  const categoryMap = useMemo(() => {
    const m = new Map<string, { name: string; color: string }>()
    for (const c of noteCategories) m.set(c.id, { name: c.name, color: c.color })
    return m
  }, [noteCategories])

  const filteredNotes = useMemo(() => {
    if (activeFilterIds.length === 0) return notes

    const wantsDone = activeFilterIds.includes(DONE_CATEGORY_ID)
    const categoryFilters = activeFilterIds.filter((id) => id !== DONE_CATEGORY_ID)

    return notes.filter((n) => {
      if (wantsDone && !n.isDone) return false
      if (categoryFilters.length === 0) return true
      // OR match: any selected category
      return categoryFilters.some((id) => n.categoryIds.includes(id))
    })
  }, [notes, activeFilterIds])

  const openNote = useMemo(() => {
    if (!openNoteId) return null
    return notes.find((n) => n.id === openNoteId) ?? null
  }, [notes, openNoteId])

  const openCategories = useMemo(() => {
    if (!openNote) return []
    return openNote.categoryIds
      .map((id) => categoryMap.get(id))
      .filter((x): x is { name: string; color: string } => Boolean(x))
  }, [openNote, categoryMap])

  const isLight = theme === 'light'

  return (
    <div
      className={[
        'w-full h-full overflow-hidden',
        isLight ? 'bg-[#f5f5f5] text-black' : 'bg-[#050505] text-white'
      ].join(' ')}
    >
      <div className="h-full w-full overflow-hidden flex flex-col">
        <div
          className={[
            'shrink-0 px-10 pt-10 pb-6 border-b',
            isLight ? 'border-black/10' : 'border-white/5'
          ].join(' ')}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className={['text-2xl font-semibold', isLight ? 'text-black' : 'text-white'].join(' ')}>
                {t('notes.title')}
              </div>
              <div className={['mt-1 text-xs', isLight ? 'text-black/50' : 'text-white/40 select-none'].join(' ')}>
                {t('notes.subtitle')}
              </div>
            </div>
            <div className="flex items-center gap-2 select-none">
              <button
                type="button"
                onClick={() => setCategoryModalOpen(true)}
                className={[
                  'inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition',
                  isLight
                    ? 'bg-white hover:bg-black/5 border-black/10 text-black'
                    : 'bg-black/20 hover:bg-white/10 border-white/10 text-white'
                ].join(' ')}
                title={t('categories.open')}
                aria-label={t('categories.open')}
              >
                <Tag size={18} />
                {t('categories.title')}
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = addNote()
                  setOpenNoteId(id)
                }}
                className={[
                  'inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition',
                  isLight
                    ? 'bg-black text-white hover:bg-black/90 border-black'
                    : 'bg-white/15 hover:bg-white/20 border-white/10 text-white'
                ].join(' ')}
              >
                <Plus size={18} />
                {t('notes.newNote')}
              </button>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setActiveFilterIds([])}
              className={`px-4 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors border
                ${
                  activeFilterIds.length === 0
                    ? isLight
                      ? 'bg-black/5 border-black/20 text-black'
                      : 'bg-white/10 border-white/20 text-white'
                    : isLight
                      ? 'bg-transparent border-black/10 text-black/60 hover:border-black/20'
                      : 'bg-transparent border-white/5 text-white/60 hover:border-white/10'
                } ${
                  // Hepsi is always shown as "disabled-ish", but still clickable to reset filters.
                  activeFilterIds.length === 0
                    ? 'opacity-45 cursor-default'
                    : 'opacity-45 hover:opacity-70 cursor-pointer'
                }`} 
            >
              {t('notes.filtersAll')}
            </button>
            {noteCategories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() =>
                  setActiveFilterIds((prev) =>
                    prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id]
                  )
                }
                className={`px-4 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors border
                  ${
                    activeFilterIds.includes(c.id)
                      ? isLight
                        ? 'bg-black/5 border-black/20 text-black'
                        : 'bg-white/10 border-white/20 text-white'
                      : isLight
                        ? 'bg-transparent border-black/10 text-black/60 hover:border-black/20'
                        : 'bg-transparent border-white/5 text-white/60 hover:border-white/10'
                  }`}
              >
                <span className="inline-flex items-center gap-2">
                  <span
                    className={['w-2.5 h-2.5 rounded-full border', isLight ? 'border-black/20' : 'border-white/20'].join(' ')}
                    style={{ backgroundColor: c.color }}
                    aria-hidden
                  />
                  {c.name}
                </span>
              </button>
            ))}
          </div>

          <div className={['mt-3 text-[12px]', isLight ? 'text-black/45' : 'text-white/35 select-none'].join(' ')}>
            {t('notes.filtersHint')}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="max-w-5xl mx-auto p-10 select-none">
            {filteredNotes.length === 0 ? (
              <div
                className={[
                  'text-sm border rounded-2xl p-6',
                  isLight
                    ? 'text-black/60 border-black/10 bg-white'
                    : 'text-white/45 border-white/10 bg-white/5'
                ].join(' ')}
              >
                {t('notes.emptyPrefix')}{' '}
                <span className={isLight ? 'text-black/80 font-semibold' : 'text-white/70 font-semibold'}>
                  {t('notes.newNote')}
                </span>{' '}
                {t('notes.emptySuffix')}
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => {
                  const overId = event.over?.id
                  if (!overId) return
                  const activeId = String(event.active.id)
                  const over = String(overId)
                  if (activeFilterIds.length === 0) {
                    reorderNotes({ activeId, overId: over })
                    return
                  }

                  // Reorder within filtered list while preserving other notes' relative order.
                  const filteredIds = filteredNotes.map((n) => n.id)
                  const from = filteredIds.indexOf(activeId)
                  const to = filteredIds.indexOf(over)
                  if (from === -1 || to === -1) return

                  const nextFiltered = [...filteredIds]
                  const moved = nextFiltered.splice(from, 1)[0]
                  nextFiltered.splice(to, 0, moved)

                  const filteredSet = new Set(filteredIds)
                  const nextNotes = [...notes]
                  let writeIdx = 0
                  for (let i = 0; i < nextNotes.length; i++) {
                    if (!filteredSet.has(nextNotes[i].id)) continue
                    const id = nextFiltered[writeIdx++]
                    const next = notes.find((n) => n.id === id)
                    if (next) nextNotes[i] = next
                  }
                  applyNotesUpdate(nextNotes)
                }}
              >
                <SortableContext
                  items={filteredNotes.map((n) => n.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredNotes.map((n) => (
                      <NoteCard
                        key={n.id}
                        id={n.id}
                        title={n.title}
                        content={n.content}
                        color={n.color}
                        categoryNames={n.categoryIds
                          .map((id) => categoryMap.get(id)?.name)
                          .filter((x): x is string => typeof x === 'string')}
                        isDone={n.isDone}
                        onToggleDone={() => updateNote(n.id, { isDone: !n.isDone })}
                        onContextMenu={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const x = e.clientX
                          const y = e.clientY
                          setMenu({ open: true, id: n.id, x, y })
                        }}
                        onOpen={() => setOpenNoteId(n.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      </div>

      {menu.open && menu.id ? (
        <div
          className={[
            'absolute z-50 rounded-lg border shadow-lg overflow-hidden',
            isLight ? 'border-black/10 bg-white text-black' : 'border-white/5 bg-[#1a1a1a] text-white'
          ].join(' ')}
          style={{ left: menu.x, top: menu.y, minWidth: 140 }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="w-full text-left px-3 py-2 text-xs hover:bg-black/5 dark:hover:bg-white/5 transition"
            onClick={() => {
              deleteNote(menu.id!)
              setMenu({ open: false, id: null, x: 0, y: 0 })
            }}
          >
            {t('contextMenu.delete')}
          </button>
          <button
            type="button"
            className="w-full text-left px-3 py-2 text-xs hover:bg-black/5 dark:hover:bg-white/5 transition"
            onClick={() => setMenu({ open: false, id: null, x: 0, y: 0 })}
          >
            {t('contextMenu.close')}
          </button>
        </div>
      ) : null}

      <ModalShell
        open={Boolean(openNote)}
        className={
          isLight
            ? 'border-black/10 bg-white text-black'
            : 'border-white/10 bg-[#0b0b0b] text-white'
        }
        onClose={() => {
          setOpenNoteId(null)
        }}
      >
        {openNote ? (
          <div className="h-full w-full flex flex-col">
            <div
              className={[
                'shrink-0 px-6 py-4 border-b flex items-center gap-3',
                isLight ? 'border-black/10' : 'border-white/10'
              ].join(' ')}
            >
              <button
                type="button"
                onClick={() => setOpenNoteId(null)}
                className={[
                  'w-10 h-10 rounded-xl border transition flex items-center justify-center',
                  isLight ? 'border-black/10 bg-black/5 hover:bg-black/10' : 'border-white/10 bg-white/5 hover:bg-white/10'
                ].join(' ')}
                title={t('common.close')}
              >
                <X size={18} />
              </button>

              <div className="flex-1 min-w-0">
                <input
                  value={openNote.title}
                  onChange={(e) => updateNote(openNote.id, { title: e.target.value })}
                  className={[
                    'w-full bg-transparent outline-none focus-visible:outline-none text-lg font-semibold',
                    isLight ? 'text-black placeholder:text-black/30' : 'text-white placeholder:text-white/20'
                  ].join(' ')}
                  placeholder={t('notes.titlePlaceholder')}
                />
                <div className={['mt-1 text-xs', isLight ? 'text-black/45' : 'text-white/35', 'select-none'].join(' ')}>
                  {openCategories.length > 0
                    ? `${t('categories.label')}: ${openCategories.map((c) => c.name).join(', ')}`
                    : `${t('categories.label')}: ${t('categories.none')}`}
                </div>
              </div>

              <button
                type="button"
                onClick={() => updateNote(openNote.id, { isDone: !openNote.isDone })}
                className={[
                  'px-3 py-2 rounded-xl border text-sm transition inline-flex items-center gap-2',
                  isLight ? 'border-black/10 bg-black/5 hover:bg-black/10' : 'border-white/10 bg-white/5 hover:bg-white/10'
                ].join(' ')}
                title={t('notes.toggleDone')}
              >
                {openNote.isDone ? (
                  <>
                    <CheckCircle2 size={18} className="text-emerald-500" /> {t('notes.done')}
                  </>
                ) : (
                  <>
                    <Circle size={18} className="text-white/30" /> {t('notes.notDone')}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  deleteNote(openNote.id)
                  setOpenNoteId(null)
                }}
                className={[
                  'w-10 h-10 rounded-xl border bg-white/5 transition flex items-center justify-center',
                  isLight
                    ? 'border-black/10 bg-black/5 hover:bg-red-500/15 hover:border-red-500/30'
                    : 'border-white/10 bg-white/5 hover:bg-red-500/15 hover:border-red-500/30'
                ].join(' ')}
                title={t('common.delete')}
              >
                <Trash2 size={18} className={isLight ? 'text-black/70' : 'text-white/70'} />
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex">
              <div className="flex-1 p-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <textarea
                  value={openNote.content}
                  onChange={(e) => updateNote(openNote.id, { content: e.target.value })}
                  placeholder={t('notes.contentPlaceholder')}
                  className={[
                    'w-full h-full min-h-[300px] resize-none bg-transparent outline-none focus-visible:outline-none text-sm leading-relaxed overflow-y-auto',
                    '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
                    isLight ? 'text-black/90 placeholder:text-black/30' : 'text-white/90 placeholder:text-white/20'
                  ].join(' ')}
                />
              </div>

              <div
                className={[
                  'w-80 border-l p-6 shrink-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
                  isLight ? 'border-black/10 bg-black/[0.02]' : 'border-white/10 bg-white/[0.02]'
                ].join(' ')}
              >
                <div className={['text-sm font-semibold mb-4', isLight ? 'text-black' : 'text-white', 'select-none'].join(' ')}>
                  {t('notes.sidebarTitle')}
                </div>

                <div className="mb-6">
                  <div className={['text-xs mb-2', isLight ? 'text-black/50' : 'text-white/40', 'select-none'].join(' ')}>
                    {t('notes.color')}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {['#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#111827'].map(
                      (c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => updateNote(openNote.id, { color: c })}
                          className={`w-9 h-9 rounded-xl border transition ${
                            openNote.color === c
                              ? isLight
                                ? 'border-black/40'
                                : 'border-white/40'
                              : isLight
                                ? 'border-black/10'
                                : 'border-white/10'
                          }`}
                          style={{ backgroundColor: c }}
                          title={c}
                        />
                      )
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <div className={['text-xs mb-2', isLight ? 'text-black/50' : 'text-white/40', 'select-none'].join(' ')}>
                    {t('categories.label')}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => updateNote(openNote.id, { categoryIds: [] })}
                      className={`px-3 py-1.5 rounded-full text-xs border transition ${
                        openNote.categoryIds.length === 0
                          ? isLight
                            ? 'border-black/30 bg-black/5 text-black'
                            : 'border-white/30 bg-white/10 text-white'
                          : isLight
                            ? 'border-black/10 bg-black/5 text-black/70 hover:bg-black/10'
                            : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {t('categories.none')}
                    </button>
                    {noteCategories
                      .filter((c) => c.id !== DONE_CATEGORY_ID)
                      .map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleNoteCategory(openNote.id, c.id)}
                        className={`px-3 py-1.5 rounded-full text-xs border transition inline-flex items-center gap-2 ${
                          openNote.categoryIds.includes(c.id)
                            ? isLight
                              ? 'border-black/30 bg-black/5 text-black'
                              : 'border-white/30 bg-white/10 text-white'
                            : isLight
                              ? 'border-black/10 bg-black/5 text-black/70 hover:bg-black/10'
                              : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        <span
                          className={['w-2.5 h-2.5 rounded-full border', isLight ? 'border-black/20' : 'border-white/20'].join(' ')}
                          style={{ backgroundColor: c.color }}
                          aria-hidden
                        />
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </ModalShell>

      <ModalShell
        open={categoryModalOpen}
        className={
          isLight
            ? 'border-black/10 bg-white text-black'
            : 'border-white/10 bg-[#0b0b0b] text-white'
        }
        onClose={() => setCategoryModalOpen(false)}
      >
        <div className="h-full w-full flex flex-col">
          <div
            className={[
              'shrink-0 px-6 py-4 border-b flex items-center justify-between gap-3',
              isLight ? 'border-black/10' : 'border-white/10'
            ].join(' ')}
          >
            <div className={['text-lg font-semibold', isLight ? 'text-black' : 'text-white'].join(' ')}>
              <span className="select-none">{t('categories.title')}</span>
            </div>
            <button
              type="button"
              onClick={() => setCategoryModalOpen(false)}
              className={[
                'w-10 h-10 rounded-xl border transition flex items-center justify-center',
                isLight
                  ? 'border-black/10 bg-black/5 hover:bg-black/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              ].join(' ')}
              title={t('common.close')}
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-6">
            <div className={['text-xs mb-3', isLight ? 'text-black/50' : 'text-white/40 select-none'].join(' ')}>
              {t('categories.addHint')}
            </div>

            <div
              className={[
                'rounded-2xl border p-4 flex items-center gap-3',
                isLight ? 'border-black/10 bg-black/[0.02]' : 'border-white/10 bg-white/[0.03]'
              ].join(' ')}
            >
              <input
                type="color"
                value={newCategoryColor}
                onChange={(e) => setNewCategoryColor(e.target.value)}
                className={[
                  'w-11 h-11 rounded-xl border p-1',
                  isLight ? 'border-black/10 bg-white' : 'border-white/10 bg-white/5'
                ].join(' ')}
                title={t('categories.color')}
              />
              <input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder={t('categories.namePlaceholder')}
                className={[
                  'flex-1 px-3 py-2 rounded-xl border text-sm outline-none',
                  isLight
                    ? 'bg-white border-black/10 text-black placeholder:text-black/30'
                    : 'bg-white/5 border-white/10 text-white placeholder:text-white/20'
                ].join(' ')}
              />
              <button
                type="button"
                onClick={() => {
                  const name = newCategoryName.trim()
                  if (!name) return
                  addNoteCategory(name, newCategoryColor)
                  setNewCategoryName('')
                }}
                className={[
                  'px-4 py-2 rounded-xl border text-sm transition inline-flex items-center gap-2',
                  isLight
                    ? 'bg-black text-white hover:bg-black/90 border-black'
                    : 'bg-white/15 hover:bg-white/20 border-white/10 text-white'
                ].join(' ')}
              >
                <Plus size={18} />
                <span className="select-none">{t('common.add')}</span>
              </button>
            </div>

            {noteCategories.length > 0 ? (
              <div className="mt-5">
                <div className={['text-xs mb-2', isLight ? 'text-black/50' : 'text-white/40', 'select-none'].join(' ')}>
                  {t('categories.existing')}
                </div>
                <div className="flex flex-wrap gap-2">
                  {noteCategories.map((c) => (
                    <div
                      key={c.id}
                      className={[
                        'inline-flex items-center gap-2 px-3 py-2 rounded-xl border',
                        isLight ? 'border-black/10 bg-white' : 'border-white/10 bg-white/5'
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'w-3 h-3 rounded-full border',
                          isLight ? 'border-black/20' : 'border-white/20'
                        ].join(' ')}
                        style={{ backgroundColor: c.color }}
                        aria-hidden
                      />
                      <span className={['text-xs', isLight ? 'text-black/80' : 'text-white/80'].join(' ')}>
                        {c.name}
                      </span>
                      {c.id !== DONE_CATEGORY_ID ? (
                        <button
                          type="button"
                          onClick={() => deleteNoteCategory(c.id)}
                          className={[
                            'ml-1 w-8 h-8 rounded-lg border border-transparent transition flex items-center justify-center',
                            isLight
                              ? 'hover:bg-red-500/10 hover:border-red-500/20'
                              : 'hover:bg-red-500/15 hover:border-red-500/30'
                          ].join(' ')}
                          title={t('common.delete')}
                        >
                          <Trash2 size={14} className={isLight ? 'text-black/50' : 'text-white/50'} />
                        </button>
                      ) : (
                        <span className={['ml-2 text-[11px]', isLight ? 'text-black/40' : 'text-white/35', 'select-none'].join(' ')}>
                          {t('categories.default')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </ModalShell>
    </div>
  )
}

