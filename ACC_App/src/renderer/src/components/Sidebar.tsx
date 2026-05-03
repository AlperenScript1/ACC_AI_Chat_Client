import { Plus, Zap, CheckCircle2, Circle, Home } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useStore } from '../store/useStore'
import Settings from './Settings'

function SidebarModelIcon({ name, icon }: { name: string; icon?: string }): React.JSX.Element {
  const [failed, setFailed] = useState(false)
  const letter = name.trim().slice(0, 1).toUpperCase()

  if (icon && !failed) {
    return (
      <img
        src={icon}
        alt={name}
        title={name}
        className="w-8 h-8 rounded-lg object-cover"
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <div
      title={name}
      className="w-8 h-8 rounded-lg bg-black/10 dark:bg-white/10 border border-black/10 dark:border-white/10 flex items-center justify-center text-xs font-semibold text-black/70 dark:text-white/80"
    >
      {letter}
    </div>
  )
}

function SortableModelItem({
  id,
  name,
  icon,
  isActive,
  isAsleep,
  isSyncEnabled,
  isSyncSelected,
  onClick,
  onToggleSyncSelected,
  onContextMenu
}: {
  id: string
  name: string
  icon?: string
  isActive: boolean
  isAsleep: boolean
  isSyncEnabled: boolean
  isSyncSelected: boolean
  onClick: () => void
  onToggleSyncSelected: () => void
  onContextMenu: (e: React.MouseEvent) => void
}): React.JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div ref={setNodeRef} style={style}>
      <button
        type="button"
        title={isAsleep ? `${name} (Uyku Modu)` : name}
        onClick={onClick}
        onContextMenu={onContextMenu}
        className={[
          'h-12 w-12 rounded-full',
          'bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15',
          'border border-black/10 dark:border-white/10',
          'transition',
          isAsleep ? 'opacity-60 hover:opacity-100' : '',
          isActive
            ? 'ring-2 ring-black/30 dark:ring-white/50 shadow-[0_0_18px_rgba(0,0,0,0.10)] dark:shadow-[0_0_18px_rgba(255,255,255,0.12)]'
            : '',
          isSyncEnabled && isSyncSelected
            ? 'ring-2 ring-purple-500 ring-offset-1 ring-offset-[#050505]'
            : ''
        ].join(' ')}
        {...attributes}
        {...listeners}
      >
        <div className="relative flex items-center justify-center">
          <SidebarModelIcon name={name} icon={icon} />
          {isAsleep && (
            <span
              className="absolute -bottom-0.5 -right-0.5 z-[5] text-[10px] leading-none select-none"
              aria-hidden
            >
              🌙
            </span>
          )}
          {isSyncEnabled && (
            <button
              type="button"
              className="absolute -top-1 -right-1 z-10"
              onClick={(e) => {
                e.stopPropagation()
                onToggleSyncSelected()
              }}
            >
              {isSyncSelected ? (
                <CheckCircle2 size={14} className="text-purple-400 bg-[#050505] rounded-full" />
              ) : (
                <Circle size={14} className="text-white/20 bg-[#050505] rounded-full" />
              )}
            </button>
          )}
        </div>
      </button>
    </div>
  )
}

export default function Sidebar(): React.JSX.Element {
  const addedModels = useStore((s) => s.addedModels)
  const activeModelId = useStore((s) => s.activeModelId)
  const setActiveModelId = useStore((s) => s.setActiveModelId)
  const mountModel = useStore((s) => s.mountModel)
  const removeModel = useStore((s) => s.removeModel)
  const toggleFavorite = useStore((s) => s.toggleFavorite)
  const reorderModelInGroup = useStore((s) => s.reorderModelInGroup)
  const theme = useStore((s) => s.theme)
  const isSyncEnabled = useStore((s) => s.isSyncEnabled)
  const syncSelection = useStore((s) => s.syncSelection)
  const toggleModelInSync = useStore((s) => s.toggleModelInSync)
  const toggleSync = useStore((s) => s.toggleSync)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const asideRef = useRef<HTMLElement | null>(null)

  const favorites = useMemo(() => addedModels.filter((m) => m.isFavorite === true), [addedModels])
  const nonFavorites = useMemo(
    () => addedModels.filter((m) => m.isFavorite !== true),
    [addedModels]
  )

  const [menu, setMenu] = useState<{
    open: boolean
    id: string | null
    x: number
    y: number
  }>({ open: false, id: null, x: 0, y: 0 })

  const contextModel = useMemo(
    () => (menu.id ? (addedModels.find((m) => m.id === menu.id) ?? null) : null),
    [menu.id, addedModels]
  )

  useEffect(() => {
    if (!menu.open) return
    const onDown = (): void => setMenu((m) => ({ ...m, open: false, id: null }))
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [menu.open])

  return (
    <aside
      ref={(node) => {
        asideRef.current = node
      }}
      className="w-16 h-screen bg-white dark:bg-[#0f0f0f] border-r border-black/5 dark:border-white/5 flex flex-col items-center py-3 gap-2"
    >
      <div className="w-full flex flex-col items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => setActiveModelId(null)}
          className={[
            'h-12 w-12 rounded-full',
            'bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10',
            'border border-black/10 dark:border-white/10',
            'transition',
            activeModelId === null
              ? 'ring-2 ring-black/30 dark:ring-white/50 shadow-[0_0_18px_rgba(0,0,0,0.10)] dark:shadow-[0_0_18px_rgba(255,255,255,0.12)]'
              : ''
          ].join(' ')}
          title="Home"
          aria-label="Home"
        >
          <Home className="mx-auto text-black/70 dark:text-white/80" size={18} />
        </button>

        <div className="w-8 h-px bg-black/10 dark:bg-white/10 my-1 mx-auto shrink-0" />
      </div>

      <div className="w-full flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col items-center gap-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(event) => {
            const overId = event.over?.id
            if (!overId) return
            reorderModelInGroup({
              activeId: String(event.active.id),
              overId: String(overId),
              group: 'favorite'
            })
          }}
        >
          <SortableContext
            items={favorites.map((m) => m.id)}
            strategy={verticalListSortingStrategy}
          >
            {favorites.map((model) => (
              <SortableModelItem
                key={model.id}
                id={model.id}
                name={model.name}
                icon={model.icon}
                isActive={model.id === activeModelId}
                isAsleep={model.isAsleep}
                isSyncEnabled={isSyncEnabled}
                isSyncSelected={syncSelection.includes(model.id)}
                onClick={() => {
                  mountModel(model.id)
                  setActiveModelId(model.id)
                }}
                onToggleSyncSelected={() => toggleModelInSync(model.id)}
                onContextMenu={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const rect = asideRef.current?.getBoundingClientRect()
                  const x = rect ? e.clientX - rect.left : e.clientX
                  const y = rect ? e.clientY - rect.top : e.clientY
                  setMenu({ open: true, id: model.id, x, y })
                }}
              />
            ))}
          </SortableContext>
        </DndContext>

        {favorites.length > 0 && nonFavorites.length > 0 ? (
          <div className="w-8 h-px bg-black/10 dark:bg-white/10 my-1 mx-auto shrink-0" />
        ) : null}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(event) => {
            const overId = event.over?.id
            if (!overId) return
            reorderModelInGroup({
              activeId: String(event.active.id),
              overId: String(overId),
              group: 'normal'
            })
          }}
        >
          <SortableContext
            items={nonFavorites.map((m) => m.id)}
            strategy={verticalListSortingStrategy}
          >
            {nonFavorites.map((model) => (
              <SortableModelItem
                key={model.id}
                id={model.id}
                name={model.name}
                icon={model.icon}
                isActive={model.id === activeModelId}
                isAsleep={model.isAsleep}
                isSyncEnabled={isSyncEnabled}
                isSyncSelected={syncSelection.includes(model.id)}
                onClick={() => {
                  mountModel(model.id)
                  setActiveModelId(model.id)
                }}
                onToggleSyncSelected={() => toggleModelInSync(model.id)}
                onContextMenu={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const rect = asideRef.current?.getBoundingClientRect()
                  const x = rect ? e.clientX - rect.left : e.clientX
                  const y = rect ? e.clientY - rect.top : e.clientY
                  setMenu({ open: true, id: model.id, x, y })
                }}
              />
            ))}
          </SortableContext>
        </DndContext>

        {menu.open && menu.id ? (
          <div
            className="absolute z-50 rounded-lg border border-black/10 dark:border-white/5 bg-white dark:bg-[#1a1a1a] text-black dark:text-white shadow-lg overflow-hidden"
            style={{ left: menu.x, top: menu.y, minWidth: 120 }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="w-full text-left px-3 py-2 text-xs hover:bg-black/5 dark:hover:bg-white/5 transition"
              onClick={() => {
                toggleFavorite(menu.id!)
                setMenu((m) => ({ ...m, open: false, id: null }))
              }}
            >
              {contextModel?.isFavorite === true ? 'Favorilerden Çıkart' : 'Favorilere Ekle'}
            </button>
            <button
              type="button"
              className="w-full text-left px-3 py-2 text-xs hover:bg-black/5 dark:hover:bg-white/5 transition"
              onClick={() => {
                removeModel(menu.id!)
                setMenu((m) => ({ ...m, open: false, id: null }))
              }}
            >
              Delete
            </button>
          </div>
        ) : null}
      </div>

      <div className="w-full flex flex-col items-center gap-2">
        <div className="w-full flex items-center justify-center pb-2">
          <button
            type="button"
            onClick={() => {
              setActiveModelId('market')
            }}
            className={[
              'h-12 w-12 rounded-full',
              'bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10',
              'border border-black/10 dark:border-white/10',
              'transition',
              'hover:shadow-[0_0_24px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_0_24px_rgba(255,255,255,0.18)]'
            ].join(' ')}
            title="Model Ekle"
            aria-label="Model Ekle"
          >
            <Plus className="mx-auto text-black/70 dark:text-white/80" size={18} />
          </button>
        </div>

        <Settings />

        <div className="w-full flex items-center justify-center pb-2">
          <button
            type="button"
            onClick={toggleSync}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all
          ${
            isSyncEnabled
              ? 'text-purple-400 shadow-lg shadow-purple-500/40'
              : theme === 'light'
                ? 'text-black/40 hover:text-black/60'
                : 'text-white/20 hover:text-white/40'
          }`}
            title="Sync Mode"
            aria-label="Sync Mode"
          >
            <Zap size={18} fill={isSyncEnabled ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
    </aside>
  )
}
