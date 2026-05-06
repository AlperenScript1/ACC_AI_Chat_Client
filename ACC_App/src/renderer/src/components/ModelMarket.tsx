import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore'

type CatalogItem = {
  id: string
  name: string
  url: string
  icon: string
  descKey: string
  categoryKey: string
  category: MarketCategory
}

const CATALOG: CatalogItem[] = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    url: 'https://chat.openai.com',
    icon: 'https://www.google.com/s2/favicons?domain=chat.openai.com&sz=64',
    descKey: 'market.items.chatgpt.desc',
    categoryKey: 'market.items.chatgpt.category'
    ,
    category: 'chat'
  },
  {
    id: 'claude',
    name: 'Claude',
    url: 'https://claude.ai',
    icon: 'https://www.google.com/s2/favicons?domain=claude.ai&sz=64',
    descKey: 'market.items.claude.desc',
    categoryKey: 'market.items.claude.category'
    ,
    category: 'coding'
  },
  {
    id: 'gemini',
    name: 'Gemini',
    url: 'https://gemini.google.com',
    icon: 'https://www.google.com/s2/favicons?domain=gemini.google.com&sz=64',
    descKey: 'market.items.gemini.desc',
    categoryKey: 'market.items.gemini.category'
    ,
    category: 'research'
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    url: 'https://perplexity.ai',
    icon: 'https://www.google.com/s2/favicons?domain=perplexity.ai&sz=64',
    descKey: 'market.items.perplexity.desc',
    categoryKey: 'market.items.perplexity.category'
    ,
    category: 'research'
  },
  {
    id: 'copilot',
    name: 'GitHub Copilot',
    url: 'https://github.com/copilot',
    icon: 'https://www.google.com/s2/favicons?domain=github.com&sz=64',
    descKey: 'market.items.copilot.desc',
    categoryKey: 'market.items.copilot.category'
    ,
    category: 'coding'
  },
  {
    id: 'midjourney',
    name: 'Midjourney',
    url: 'https://www.midjourney.com',
    icon: 'https://www.google.com/s2/favicons?domain=midjourney.com&sz=64',
    descKey: 'market.items.midjourney.desc',
    categoryKey: 'market.items.midjourney.category'
    ,
    category: 'visual'
  },
  {
    id: 'ideogram',
    name: 'Ideogram',
    url: 'https://ideogram.ai',
    icon: 'https://www.google.com/s2/favicons?domain=ideogram.ai&sz=64',
    descKey: 'market.items.ideogram.desc',
    categoryKey: 'market.items.ideogram.category'
    ,
    category: 'visual'
  },
  {
    id: 'mistral',
    name: 'Mistral',
    url: 'https://chat.mistral.ai',
    icon: 'https://www.google.com/s2/favicons?domain=mistral.ai&sz=64',
    descKey: 'market.items.mistral.desc',
    categoryKey: 'market.items.mistral.category'
    ,
    category: 'chat'
  },
  {
    id: 'grok',
    name: 'Grok',
    url: 'https://grok.com',
    icon: 'https://www.google.com/s2/favicons?domain=grok.com&sz=64',
    descKey: 'market.items.grok.desc',
    categoryKey: 'market.items.grok.category'
    ,
    category: 'chat'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    url: 'https://chat.deepseek.com',
    icon: 'https://www.google.com/s2/favicons?domain=deepseek.com&sz=64',
    descKey: 'market.items.deepseek.desc',
    categoryKey: 'market.items.deepseek.category'
    ,
    category: 'coding'
  },
  {
    id: 'poe',
    name: 'Poe',
    url: 'https://poe.com',
    icon: 'https://www.google.com/s2/favicons?domain=poe.com&sz=64',
    descKey: 'market.items.poe.desc',
    categoryKey: 'market.items.poe.category'
    ,
    category: 'chat'
  },
  {
    id: 'suno',
    name: 'Suno',
    url: 'https://suno.com',
    icon: 'https://www.google.com/s2/favicons?domain=suno.com&sz=64',
    descKey: 'market.items.suno.desc',
    categoryKey: 'market.items.suno.category'
    ,
    category: 'visual'
  }
]

const CATEGORIES = ['all', 'chat', 'coding', 'research', 'visual'] as const
type MarketCategory = (typeof CATEGORIES)[number]

function ModelCard({
  item,
  added,
  onAdd,
  onOpen
}: {
  item: CatalogItem
  added: boolean
  onAdd: () => void
  onOpen: () => void
}): React.JSX.Element {
  const { t } = useTranslation()
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`bg-white dark:bg-[#0f0f0f]
                 border border-slate-200 dark:border-white/5
                 rounded-2xl p-5 flex flex-col gap-4 transition-all duration-200
                 ${hovered ? 'scale-[1.02] border-white/10 dark:border-white/10' : ''}`}
    >
      <div className="flex items-center gap-3">
        <img src={item.icon} className="w-10 h-10 rounded-xl object-cover" alt={item.name} />
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-white">{item.name}</p>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {t(item.categoryKey)}
          </p>
        </div>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed flex-1">
        {t(item.descKey)}
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onOpen}
          className="flex-1 py-2 rounded-lg text-xs border border-slate-200 dark:border-white/10
                       text-slate-700 dark:text-slate-300
                       hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
        >
          {t('market.open')}
        </button>
        <button
          type="button"
          onClick={onAdd}
          disabled={added}
          className={`flex-1 py-2 rounded-lg text-xs transition-colors
              ${
                added
                  ? 'bg-slate-100 text-slate-400 cursor-default border border-slate-200 dark:bg-white/5 dark:text-slate-500 dark:border-white/10'
                  : 'bg-slate-900 text-white hover:bg-slate-800 border border-slate-900 dark:bg-white/10 dark:text-white dark:hover:bg-white/15 dark:border-white/10'
              }`}
        >
          {added ? `✓ ${t('market.added')}` : `+ ${t('market.add')}`}
        </button>
      </div>
    </div>
  )
}

export default function ModelMarket(): React.JSX.Element {
  const { t } = useTranslation()
  const models = useStore((s) => s.addedModels)
  const addModel = useStore((s) => s.addModel)
  const mountModel = useStore((s) => s.mountModel)
  const setActiveModelId = useStore((s) => s.setActiveModelId)

  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<MarketCategory>('all')

  const isAdded = (item: CatalogItem): boolean => models.some((m) => m.url === item.url)

  const filtered = useMemo(() => {
    return CATALOG.filter(
      (item) => activeCategory === 'all' || item.category === activeCategory
    ).filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))
  }, [activeCategory, query])

  return (
    <div className="w-full h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-[#050505] dark:bg-[#050505] bg-gray-50">
      <div className="max-w-5xl mx-auto p-10">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-8">
          {t('market.title')}
        </h1>

        <div
          className="flex items-center gap-3 bg-[#0f0f0f] dark:bg-[#0f0f0f] bg-white
                    border border-white/5 dark:border-white/5 border-black/10
                    rounded-xl px-4 py-3 mb-6"
        >
          <Search size={16} className="text-white/30 dark:text-white/30 text-black/30 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('market.searchPlaceholder')}
            className="bg-transparent flex-1 text-sm outline-none
                        text-slate-900 dark:text-white
                        placeholder:text-white/20 dark:placeholder:text-white/20 placeholder:text-black/30"
          />
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors border
                  ${
                    activeCategory === cat
                      ? 'bg-white/10 border-white/20 text-slate-900 dark:text-white'
                      : 'bg-transparent border-white/5 dark:border-white/5 border-black/10 text-slate-600 dark:text-slate-400 hover:border-white/10'
                  }`}
            >
              {t(`market.categories.${cat}`)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {filtered.map((item) => (
            <ModelCard
              key={item.id}
              item={item}
              added={isAdded(item)}
              onAdd={() => {
                if (!isAdded(item)) {
                  addModel({ id: item.id, name: item.name, url: item.url, icon: item.icon })
                  setActiveModelId('market')
                }
              }}
              onOpen={() => {
                const existing = models.find((m) => m.url === item.url)
                if (existing) {
                  mountModel(existing.id)
                  setActiveModelId(existing.id)
                  return
                }
                addModel({ id: item.id, name: item.name, url: item.url, icon: item.icon })
                mountModel(item.id)
                setActiveModelId(item.id)
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
