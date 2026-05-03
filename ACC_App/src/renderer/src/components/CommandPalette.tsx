import { Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../store/useStore'

type CommandPaletteProps = {
  onClose: () => void
}

export default function CommandPalette({ onClose }: CommandPaletteProps): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement | null>(null)

  const models = useStore((s) => s.addedModels)
  const mountedModels = useStore((s) => s.mountedModels)
  const setActiveModelId = useStore((s) => s.setActiveModelId)

  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return models
      .filter((m) => mountedModels.includes(m.id))
      .filter((m) => m.name.toLowerCase().includes(q))
  }, [models, mountedModels, query])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const selectModel = (id: string): void => {
    setActiveModelId(id)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#0f0f0f] border border-black/10 dark:border-white/5 rounded-xl w-[480px] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-black/10 dark:border-white/5">
          <Search size={16} className="text-black/30 dark:text-white/30 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSelectedIndex((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSelectedIndex((i) => Math.max(i - 1, 0))
              } else if (e.key === 'Enter') {
                e.preventDefault()
                const m = filtered[selectedIndex]
                if (m) selectModel(m.id)
              } else if (e.key === 'Escape') {
                e.preventDefault()
                onClose()
              }
            }}
            className="bg-transparent flex-1 text-sm text-black dark:text-white outline-none focus-visible:outline-none focus-visible:ring-0 placeholder:text-black/30 dark:placeholder:text-white/20"
            placeholder="Model ara... (Aratmak için modeli tek seferlik açmanız gerekiyor.)"
            autoFocus
          />
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto py-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {filtered.length === 0 ? (
            <p className="text-black/20 dark:text-white/20 text-sm text-center py-8">
              Sonuç bulunamadı <br />
              Eğer ekli AI modeliniz yoksa sol altta bulunan "+" ile model ekleyebilirsiniz.
            </p>
          ) : (
            filtered.map((m, i) => (
              <div
                key={m.id}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm transition-colors
                   ${
                     i === selectedIndex
                       ? 'bg-black/5 dark:bg-white/10 text-black dark:text-white'
                       : 'text-black/40 dark:text-white/40 hover:bg-black/5 dark:hover:bg-white/5'
                   }`}
                onMouseEnter={() => setSelectedIndex(i)}
                onClick={() => selectModel(m.id)} 
              >
                <img src={m.icon} className="w-6 h-6 rounded-md object-cover" alt={m.name} />
                <span>{m.name}</span> 
              </div>
            ))                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  
          )}
        </div>
      </div>
    </div>
  )
}
