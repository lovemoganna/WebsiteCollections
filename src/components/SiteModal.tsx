import { useState, useEffect, useRef } from 'react';
import { SiteCard } from '../types';
import { X, Search, Wand2, Eraser, Info, AlertTriangle, Hash } from 'lucide-react';
import { useStore } from '../hooks/useStorage';
import { AnimatePresence, motion } from 'motion/react';

const MOCK_EXAMPLES = [
  { url: 'https://v3.vuejs.org/', name: 'Vue.js', desc: '易学易用，性能出色，适用场景丰富的 Web 前端结构框架。', tags: ['前端', '开发', '框架'] },
  { url: 'https://figma.com/', name: 'Figma', desc: '强大的在线协同设计工具，适用于 UI/UX 原型设计。', tags: ['设计', '工具', '协作'] },
  { url: 'https://linear.app/', name: 'Linear', desc: '专为现代团队打造的高效项目管理与 Issue 跟踪工具。', tags: ['生产力', '工具', '管理'] },
  { url: 'https://news.ycombinator.com/', name: 'Hacker News', desc: '高质量的科技互联网领域最新资讯与讨论社区。', tags: ['资讯', '开发者', '社区'] },
  { url: 'https://github.com/', name: 'GitHub', desc: '全球最大的开源软件开发与项目代码托管平台。', tags: ['开发', '开源', '代码'] },
];

interface SiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<SiteCard>) => void;
  initialData?: SiteCardType | null;
}

type SiteCardType = SiteCard;

export function SiteModal({ isOpen, onClose, onSave, initialData }: SiteModalProps) {
  const { cards, tags: allTags, updateCard } = useStore();
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const tagsInputRef = useRef<HTMLInputElement>(null);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [thumbType, setThumbType] = useState<SiteCard['thumbType']>('auto');
  const [thumbUrl, setThumbUrl] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  // Merge modal states
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [duplicateCards, setDuplicateCards] = useState<SiteCardType[]>([]);
  const [pendingTags, setPendingTags] = useState<string[]>([]);
  const [selectedTagsToMerge, setSelectedTagsToMerge] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setUrl(initialData.url);
        setName(initialData.name);
        setDesc(initialData.desc || '');
        setTagsInput(initialData.tags.join(', '));
        setThumbType(initialData.thumbType);
        setThumbUrl(initialData.thumb || '');
      } else {
        setUrl('');
        setName('');
        setDesc('');
        setTagsInput('');
        setThumbType('auto');
        setThumbUrl('');
      }
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !showMergeModal) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, showMergeModal]);

  const handleParseUrl = async () => {
    if (!url) return;
    try {
      setIsParsing(true);
      // Construct Microlink API URL
      const apiEndpoint = `https://api.microlink.io?url=${encodeURIComponent(url)}`;
      const res = await fetch(apiEndpoint);
      const data = await res.json();
      
      if (data.status === 'success') {
        if (!name && data.data.title) setName(data.data.title);
        if (!desc && data.data.description) setDesc(data.data.description);
        if (thumbType === 'auto') {
          if (data.data.image?.url) {
            setThumbUrl(data.data.image.url);
          } else {
            try {
              const urlObj = new URL(url);
              setThumbUrl(`https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=128`);
            } catch (err) {
              // Ignore
            }
          }
        }
      }
    } catch (e) {
      console.error("Failed to parse URL via Microlink", e);
      if (thumbType === 'auto') {
        try {
          const urlObj = new URL(url);
          setThumbUrl(`https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=128`);
        } catch (err) {
          // Ignore
        }
      }
    } finally {
      setIsParsing(false);
    }
  };

  const handleUrlBlur = () => {
    // Only auto-parse if name is empty to prevent overwriting user input unintentionally
    if (url && !name) {
      handleParseUrl();
    }
  };

  const handleClear = () => {
    setUrl('');
    setName('');
    setDesc('');
    setTagsInput('');
    setThumbUrl('');
  };

  const handleMagicFill = () => {
    const random = MOCK_EXAMPLES[Math.floor(Math.random() * MOCK_EXAMPLES.length)];
    setUrl(random.url);
    setName(random.name);
    setDesc(random.desc);
    setTagsInput(random.tags.join(', '));
    setThumbUrl('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !name) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    // Look for duplicates
    const duplicates = cards.filter(c => c.url === url && (!initialData || c.id !== initialData.id));
    if (duplicates.length > 0) {
      // Only show and select tags that are actually new to the existing cards
      const existingTags = new Set(duplicates.flatMap(c => c.tags));
      const newTagsToMerge = tags.filter(t => !existingTags.has(t));
      
      setDuplicateCards(duplicates);
      setPendingTags(newTagsToMerge);
      setSelectedTagsToMerge(newTagsToMerge);
      setShowMergeModal(true);
      return;
    }

    let finalThumbUrl = thumbUrl;
    if (thumbType === 'auto' && !finalThumbUrl) {
      try {
        const urlObj = new URL(url);
        finalThumbUrl = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=128`;
      } catch (err) {
        // Ignore invalid URL errors
      }
    }

    onSave({
      url,
      name,
      desc,
      tags,
      thumbType,
      thumb: finalThumbUrl,
    });
    onClose();
  };

  const handleMergeConfirm = () => {
    duplicateCards.forEach(dup => {
      const mergedTags = Array.from(new Set([...dup.tags, ...selectedTagsToMerge]));
      updateCard(dup.id, { tags: mergedTags });
    });
    setShowMergeModal(false);
    onClose();
  };

  // Autocomplete Logic
  const currentTagSegment = tagsInput.split(',').pop()?.trim() || '';
  const existingEnteredTags = tagsInput.split(',').map(t => t.trim().toLowerCase());
  
  const tagSuggestions = currentTagSegment
    ? allTags.filter(tag => 
        tag.toLowerCase().includes(currentTagSegment.toLowerCase()) && 
        !existingEnteredTags.includes(tag.toLowerCase())
      ).slice(0, 5)
    : [];

  const handleTagSelect = (suggestion: string) => {
    const parts = tagsInput.split(',');
    parts.pop(); // Remove the currently typing part
    const newParts = parts.length > 0 ? parts.map(p => p.trim()) : [];
    newParts.push(suggestion);
    setTagsInput(newParts.join(', ') + ', ');
    setShowTagSuggestions(false);
    setActiveSuggestionIndex(-1);
    tagsInputRef.current?.focus();
  };

  const handleTagsKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showTagSuggestions || tagSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => (prev < tagSuggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (activeSuggestionIndex >= 0) {
        e.preventDefault();
        handleTagSelect(tagSuggestions[activeSuggestionIndex]);
      } else if (tagSuggestions.length > 0 && e.key === 'Tab') {
        e.preventDefault();
        handleTagSelect(tagSuggestions[0]);
      }
    } else if (e.key === 'Escape') {
      setShowTagSuggestions(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div 
        className="glass w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
            {initialData ? '编辑网站' : '添加网站'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 模块背景说明 */}
          <div className="bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-lg p-3 flex gap-3 text-sm">
            <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <div className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
              <p className="font-medium text-slate-800 dark:text-slate-200 mb-0.5 text-sm">如何高效组织收录？</p>
              粘贴 URL 后可点击搜索图标利用 <strong>API 智能解析</strong> 网站信息。详细的<strong>描述</strong>与分类<strong>标签</strong>能让“卡片墙”更规整，极大提升事后检索的命中率。
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 !mt-2 !mb-1">
            {!initialData && (
              <button
                type="button"
                onClick={handleMagicFill}
                className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 transition-colors"
                title="随机填充一条优质网站的示例数据"
              >
                <Wand2 className="w-3.5 h-3.5" />
                AI 一键填充
              </button>
            )}
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
              title="清空当前表单所有输入"
            >
              <Eraser className="w-3.5 h-3.5" />
              快速清除
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              网站地址 (URL) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={handleUrlBlur}
                placeholder="https://example.com"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-slate-900 dark:text-white transition"
              />
              <button
                type="button"
                onClick={handleParseUrl}
                disabled={!url || isParsing}
                className="absolute right-2 top-1.5 p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-50 transition"
                title="解析网址智能填充"
              >
                <Search className={`w-4 h-4 ${isParsing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              网站名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="网站的显示名称"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-slate-900 dark:text-white transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              描述
            </label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="简单介绍一下这个网站..."
              rows={2}
              maxLength={200}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none bg-white dark:bg-slate-900 dark:text-white transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              标签 (多个以逗号分隔)
            </label>
            <div className="relative">
              <input
                ref={tagsInputRef}
                type="text"
                value={tagsInput}
                onChange={(e) => {
                  setTagsInput(e.target.value);
                  setShowTagSuggestions(true);
                  setActiveSuggestionIndex(-1);
                }}
                onFocus={() => setShowTagSuggestions(true)}
                onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                onKeyDown={handleTagsKeyDown}
                placeholder="例如: 设计, 工具, 灵感"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white dark:bg-slate-900 dark:text-white transition"
              />
              <AnimatePresence>
                {showTagSuggestions && tagSuggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
                  >
                    {tagSuggestions.map((suggestion, index) => (
                      <div
                        key={suggestion}
                        onClick={() => handleTagSelect(suggestion)}
                        className={`px-3 py-2 text-sm cursor-pointer transition-colors flex items-center gap-2 ${
                          activeSuggestionIndex === index 
                            ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' 
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        <Hash className="w-3.5 h-3.5 opacity-50" />
                        {suggestion}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
            >
              {initialData ? '保存修改' : '添加网站'}
            </button>
          </div>
        </form>
      </div>

      {/* Duplicate Merge Confirmation Modal */}
      {showMergeModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div 
            className="glass w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                    发现重复的网址
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    该网址已被收藏过。是否将新输入的标签批量合并到已存在的所有相同卡片中？
                  </p>
                </div>
              </div>

              {pendingTags.length > 0 ? (
                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">选择要合并的新标签：</h4>
                  <div className="flex flex-wrap gap-2">
                    {pendingTags.map(tag => (
                      <label key={tag} className="flex items-center gap-2 cursor-pointer bg-white dark:bg-slate-700/50 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-indigo-400 transition-colors">
                        <input 
                          type="checkbox" 
                          className="rounded text-indigo-600 focus:ring-indigo-500 bg-slate-100 border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:checked:bg-indigo-500"
                          checked={selectedTagsToMerge.includes(tag)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTagsToMerge(prev => [...prev, tag]);
                            } else {
                              setSelectedTagsToMerge(prev => prev.filter(t => t !== tag));
                            }
                          }}
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{tag}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="text-sm text-slate-500 dark:text-slate-400">目前输入的标签已完全存在于旧卡片中，无需合并任何新标签。</p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3 rounded-b-2xl border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setShowMergeModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleMergeConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
              >
                {pendingTags.length > 0 ? '合并标签并完成' : '去重并关闭'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
