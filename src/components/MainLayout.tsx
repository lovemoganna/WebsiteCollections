import { useState, useMemo, useEffect } from 'react';
import { useStore } from '../hooks/useStorage';
import { SiteCard } from './SiteCard';
import { SiteModal } from './SiteModal';
import { ConfirmModal } from './ConfirmModal';
import { DataModal } from './DataModal';
import { SiteCard as SiteCardType } from '../types';
import { Plus, Search, Globe, Hash, Settings, LayoutGrid, List, ArrowDownUp, Zap, Loader2, Star, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export default function MainLayout() {
  const { cards, tags, addCard, updateCard, deleteCard, bulkDeleteCards } = useStore();
  
  // State
  const [search, setSearch] = useState('');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<SiteCardType | null>(null);
  const [deletingCard, setDeletingCard] = useState<SiteCardType | null>(null);
  
  // New States for MECE optimizations
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'az'>('newest');
  const [isAutoAdding, setIsAutoAdding] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const isSelectionMode = selectedIds.size > 0;

  const toggleSelection = (card: SiteCardType) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(card.id)) newSet.delete(card.id);
      else newSet.add(card.id);
      return newSet;
    });
  };

  // Keyboard shortcut for adding
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Use 'n' to open modal, but not if user is typing in an input/textarea
      if (e.key === 'n' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (
          document.activeElement?.tagName === 'INPUT' ||
          document.activeElement?.tagName === 'TEXTAREA'
        ) {
          return;
        }
        e.preventDefault();
        setIsModalOpen(true);
      }
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (
          document.activeElement?.tagName === 'INPUT' ||
          document.activeElement?.tagName === 'TEXTAREA'
        ) {
          return;
        }
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtering and Sorting
  const filteredCards = useMemo(() => {
    let result = cards.filter((card) => {
      const matchesSearch = 
        search === '' || 
        card.name.toLowerCase().includes(search.toLowerCase()) || 
        card.url.toLowerCase().includes(search.toLowerCase()) || 
        (card.desc && card.desc.toLowerCase().includes(search.toLowerCase())) ||
        card.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));

      const matchesTags = 
        activeTags.length === 0 || 
        activeTags.every(t => card.tags.includes(t));

      return matchesSearch && matchesTags;
    });

    // Handle Sorting
    result.sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortOrder === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortOrder === 'az') {
        return a.name.localeCompare(b.name, 'zh-CN');
      }
      return 0;
    });

    return result;
  }, [cards, search, activeTags, sortOrder]);

  const toggleTag = (tag: string) => {
    setActiveTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = (data: Partial<SiteCardType>) => {
    if (editingCard) {
      updateCard(editingCard.id, data);
    } else {
      // 查重：阻止重复添加
      const isDuplicate = cards.some(c => c.url === data.url);
      if (isDuplicate) {
        alert('系统拦截：检测到收藏夹内已存在该网页，请勿重复添加。');
        return;
      }
      addCard(data);
    }
  };

  const handleAutoPaste = async () => {
    try {
      let text = '';
      try {
        text = await navigator.clipboard.readText();
      } catch (clipboardError) {
        console.warn('Clipboard read failed, falling back to prompt:', clipboardError);
        const userInput = prompt('自动获取剪贴板失败（可能由于浏览器权限限制）。\n\n您可以在此处手动粘贴想要收录的网址：');
        if (userInput !== null) {
          text = userInput;
        } else {
          return; // User cancelled
        }
      }

      if (!text || !/^https?:\/\//i.test(text.trim())) {
        alert('闪电收录失败：未发现合法的网页链接 (需以 http / https 开头)。');
        return;
      }

      setIsAutoAdding(true);
      const url = text.trim();
      const apiEndpoint = `https://api.microlink.io?url=${encodeURIComponent(url)}`;
      const res = await fetch(apiEndpoint);
      const data = await res.json();

      if (data.status === 'success') {
        let domain = url;
        try {
          domain = new URL(url).hostname.replace(/^www\./, '');
        } catch (e) {}

        const duplicateCheck = cards.some(c => c.url === url);
        if (duplicateCheck) {
          alert('系统拦截：检测到收藏夹内已存在该网页，请勿重复添加。');
          return;
        }

        addCard({
          url: url,
          name: data.data.title || domain,
          desc: data.data.description || '',
          thumb: data.data.image?.url || '',
          thumbType: data.data.image?.url ? 'auto' : 'fallback',
          domain: domain,
          tags: ['⚡闪电收录'],
        });
      } else {
        addCard({ url: url, tags: ['⚡闪电收录'] });
      }
    } catch (err) {
      console.error(err);
      alert('读取剪贴板失败，或网络请求发生错误。请确保浏览器允许此网页读取剪贴板内容。');
    } finally {
      setIsAutoAdding(false);
    }
  };

  return (
    <div className="relative min-h-screen font-sans flex flex-col w-full text-slate-800 dark:text-slate-200">
      <div className="mesh-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>
      {/* Header */}
      <header className="sticky top-0 z-30 glass px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Globe className="w-6 h-6" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white hidden sm:block">
              我的网站收藏
            </h1>
          </div>

          <div className="flex-1 max-w-xl mx-auto flex items-center gap-3">
            <div className="relative flex-1 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input
                id="search-input"
                type="text"
                placeholder="搜索名称、网址、标签... (按 / 聚焦)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-900 dark:text-white"
              />
            </div>
            
            <button
              onClick={handleAutoPaste}
              disabled={isAutoAdding}
              className={`p-2 glass rounded-full shadow-sm transition-all shrink-0 ${
                isAutoAdding 
                  ? 'opacity-70 cursor-not-allowed text-amber-500' 
                  : 'text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30'
              }`}
              title="彩蛋：闪电收录 (自动读取剪贴板网址并解析)"
            >
              {isAutoAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-current" />}
            </button>

            <button
              onClick={() => {
                setEditingCard(null);
                setIsModalOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">添加收藏</span>
              <span className="sm:hidden">添加</span>
            </button>
            
            <button
              onClick={() => setIsDataModalOpen(true)}
              className="p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 glass rounded-full shadow-sm hover:bg-white/50 transition-all shrink-0"
              title="设置与数据流转"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tags Filter */}
        {tags.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Hash className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300">按标签筛选</h2>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar items-center pb-2">
              <button
                onClick={() => setActiveTags([])}
                className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors flex items-center gap-1.5 shrink-0 ${
                  activeTags.length === 0
                    ? 'active-tab shadow-sm'
                    : 'text-slate-600 hover:bg-white/60 dark:text-slate-300 dark:hover:bg-slate-800/60'
                }`}
              >
                全部
              </button>
              {tags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors flex items-center gap-1.5 ${
                    activeTags.includes(tag)
                      ? 'active-tab shadow-sm'
                      : 'text-slate-600 hover:bg-white/60 dark:text-slate-300 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {tag}
                  <span className={`text-[10px] px-1.5 py-[1px] font-bold rounded-full ${
                    activeTags.includes(tag) 
                      ? 'bg-indigo-300/40 dark:bg-indigo-900/60 text-white' 
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}>
                    {cards.filter(c => c.tags.includes(tag)).length}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Presentation Controls: Sorting and View Toggle */}
        <div className="flex flex-wrap items-center justify-between mb-8 gap-4 border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <ArrowDownUp className="w-4 h-4" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-transparent border-none focus:ring-0 cursor-pointer font-medium outline-none"
            >
              <option value="newest">按时间（最新）</option>
              <option value="oldest">按时间（最早）</option>
              <option value="az">按名称（A-Z）</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'grid' 
                  ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
              title="网格视图"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'list' 
                  ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
              title="列表视图"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content Render */}
        {filteredCards.length > 0 ? (
          <>
            {/* Pinned Section */}
            {filteredCards.some(card => card.isPinned) && (
              <div className="mb-10">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400 fill-current" /> 星标收藏
                </h3>
                <div className={viewMode === 'grid' 
                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                  : "flex flex-col gap-3 max-w-4xl mx-auto"
                }>
                  <AnimatePresence>
                    {filteredCards.filter(c => c.isPinned).map((card) => (
                      <SiteCard
                        key={card.id}
                        card={card}
                        viewMode={viewMode}
                        onEdit={(c) => {
                          setEditingCard(c);
                          setIsModalOpen(true);
                        }}
                        onDelete={(c) => setDeletingCard(c)}
                        onTogglePin={(c) => updateCard(c.id, { isPinned: !c.isPinned })}
                        isSelected={selectedIds.has(card.id)}
                        isSelectionMode={isSelectionMode}
                        onToggleSelect={toggleSelection}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Unpinned Section */}
            {filteredCards.some(card => !card.isPinned) && (
              <div>
                {filteredCards.some(card => card.isPinned) && (
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">
                    全部收藏
                  </h3>
                )}
                <div className={viewMode === 'grid' 
                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                  : "flex flex-col gap-3 max-w-4xl mx-auto"
                }>
                  <AnimatePresence>
                    {filteredCards.filter(c => !c.isPinned).map((card) => (
                      <SiteCard
                        key={card.id}
                        card={card}
                        viewMode={viewMode}
                        onEdit={(c) => {
                          setEditingCard(c);
                          setIsModalOpen(true);
                        }}
                        onDelete={(c) => setDeletingCard(c)}
                        onTogglePin={(c) => updateCard(c.id, { isPinned: !c.isPinned })}
                        isSelected={selectedIds.has(card.id)}
                        isSelectionMode={isSelectionMode}
                        onToggleSelect={toggleSelection}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-24 px-4 glass rounded-2xl overflow-hidden card-shadow flex flex-col items-center border-dashed border-2 border-slate-300 dark:border-slate-700 bg-transparent opacity-80">
            <Globe className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              {search || activeTags.length > 0 ? '没有找到符合条件的网站' : '还没有收藏任何网站'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
              {search || activeTags.length > 0 
                ? '尝试更改搜索词或取消一些标签筛选。' 
                : '点击右上角的"添加网站"按钮，或者按快捷键 "N" 即可快速开始收藏。'
              }
            </p>
            {!(search || activeTags.length > 0) && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-transparent shadow-sm text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                <Plus className="w-4 h-4" />
                立即添加
              </button>
            )}
          </div>
        )}
      </main>

      <SiteModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          // Small delay before unmounting initial data to let animation finish smoothly
          setTimeout(() => setEditingCard(null), 200); 
        }}
        onSave={handleSave}
        initialData={editingCard}
      />

      <DataModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
      />

      <ConfirmModal
        isOpen={!!deletingCard}
        title="删除确认"
        message={`确定要删除 "${deletingCard?.name}" 这个网站吗？此操作无法撤销。`}
        onConfirm={() => {
          if (deletingCard) {
            deleteCard(deletingCard.id);
          }
        }}
        onCancel={() => setDeletingCard(null)}
        confirmText="删除"
      />

      <ConfirmModal
        isOpen={showBulkDeleteConfirm}
        title="批量删除确认"
        message={`确定要删除已选中的 ${selectedIds.size} 个网站收藏吗？此操作无法撤销。`}
        onConfirm={() => {
          bulkDeleteCards(Array.from(selectedIds));
          setSelectedIds(new Set());
          setShowBulkDeleteConfirm(false);
        }}
        onCancel={() => setShowBulkDeleteConfirm(false)}
        confirmText="删除全部选中"
      />

      {/* Floating Bulk Action Bar */}
      <AnimatePresence>
        {isSelectionMode && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 glass px-6 py-3.5 rounded-full card-shadow flex items-center gap-5 border border-slate-200 dark:border-slate-700 shadow-2xl"
          >
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              已选择 {selectedIds.size} 项
            </span>
            <div className="w-px h-4 bg-slate-300 dark:bg-slate-600"></div>
            <button 
              onClick={() => setSelectedIds(new Set())} 
              className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              取消多选
            </button>
            <button 
              onClick={() => setShowBulkDeleteConfirm(true)} 
              className="text-sm text-white bg-red-500 hover:bg-red-600 px-4 py-1.5 rounded-full font-medium flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
              删除选中项
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
