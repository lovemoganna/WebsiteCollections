import { useState } from 'react';
import { SiteCard as SiteCardType } from '../types';
import { cn, timeAgo } from '../lib/utils';
import { Edit2, Trash2, Star } from 'lucide-react';
import { motion } from 'motion/react';

interface SiteCardProps {
  card: SiteCardType;
  onEdit: (card: SiteCardType) => void;
  onDelete: (card: SiteCardType) => void;
  onTogglePin: (card: SiteCardType) => void;
  isSelected?: boolean;
  isSelectionMode?: boolean;
  onToggleSelect?: (card: SiteCardType, e: React.MouseEvent) => void;
  viewMode?: 'grid' | 'list';
}

export function SiteCard({ card, onEdit, onDelete, onTogglePin, isSelected, isSelectionMode, onToggleSelect, viewMode = 'grid' }: SiteCardProps) {
  const [imageError, setImageError] = useState(false);
  const showFallback = imageError || card.thumbType === 'fallback' || !card.thumb;

  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
        className={`group relative flex items-center gap-4 p-3 glass rounded-xl card-shadow overflow-hidden hover:-translate-y-0.5 transition-all duration-200 cursor-pointer w-full ${
          isSelected ? 'ring-2 ring-indigo-500 bg-indigo-50/10 dark:bg-indigo-900/10' : ''
        }`}
        onClick={(e) => {
          if (isSelectionMode) {
            onToggleSelect?.(card, e);
          } else {
            window.open(card.url, '_blank')
          }
        }}
      >
        {/* Selection Checkbox overlay */}
        <div className={`absolute top-2 left-2 z-20 ${isSelected || isSelectionMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect?.(card, e);
            }}
            className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-colors ${
              isSelected 
                ? 'bg-indigo-500 border-indigo-500' 
                : 'border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-800/80 hover:border-indigo-400'
            }`}
          >
            {isSelected && (
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>

        {/* Thumbnail Area - Smaller for list */}
        <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden relative bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
          {!showFallback ? (
            <img
              src={card.thumb}
              alt={card.name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-white"
              style={{ backgroundColor: card.color || '#4F46E5' }}
            >
              <span className="text-xl font-bold uppercase tracking-wider opacity-90 drop-shadow-sm">
                {card.domain.substring(0, 2)}
              </span>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0 pr-4 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900 dark:text-white truncate" title={card.name}>
              {card.name}
            </h3>
            <span className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded shrink-0 hidden sm:inline">
              {timeAgo(card.updatedAt || card.createdAt)}
            </span>
            <span className="text-xs text-slate-400 truncate hidden sm:inline" title={card.domain}>
              · {card.domain}
            </span>
          </div>
          
          {card.desc && (
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate mb-1" title={card.desc}>
              {card.desc}
            </p>
          )}

          <div className="flex flex-wrap gap-1.5 hidden sm:flex mt-1">
            {card.tags.map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 bg-indigo-50/80 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-[10px] rounded-md font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className={`flex gap-1 transition-opacity z-10 shrink-0 ${card.isPinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(card);
            }}
            className={`p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${card.isPinned ? 'text-amber-500' : 'text-slate-500 hover:text-amber-500 dark:text-slate-400 dark:hover:text-amber-400'}`}
            title={card.isPinned ? "取消星标" : "设为星标"}
          >
            <Star className={`w-4 h-4 ${card.isPinned ? 'fill-current' : ''}`} />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(card);
            }}
            className="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="编辑"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(card);
            }}
            className="p-1.5 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            title="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    );
  }

  // Grid Mode (Default)
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, height: 0 }}
      transition={{ duration: 0.2 }}
      className={`group relative flex flex-col glass rounded-2xl card-shadow overflow-hidden hover:-translate-y-1 transition-all duration-200 cursor-pointer ${
        isSelected ? 'ring-2 ring-indigo-500 bg-indigo-50/10 dark:bg-indigo-900/10' : ''
      }`}
      onClick={(e) => {
        if (isSelectionMode) {
          onToggleSelect?.(card, e);
        } else {
          window.open(card.url, '_blank')
        }
      }}
    >
      {/* Selection Checkbox overlay */}
      <div className={`absolute top-2 left-2 z-20 ${isSelected || isSelectionMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
        <div 
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect?.(card, e);
          }}
          className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-colors ${
            isSelected 
              ? 'bg-indigo-500 border-indigo-500' 
              : 'border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-800/80 hover:border-indigo-400'
          }`}
        >
          {isSelected && (
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>

      {/* Action Buttons (visible on hover or if pinned) */}
      <div className={`absolute top-2 right-2 flex gap-1 transition-opacity z-10 ${card.isPinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin(card);
          }}
          className={`p-1.5 glass hover:bg-white dark:hover:bg-slate-700 rounded-md shadow-sm transition-colors ${card.isPinned ? 'text-amber-500' : 'text-slate-800 dark:text-slate-200'}`}
          title={card.isPinned ? "取消星标" : "设为星标"}
        >
          <Star className={`w-4 h-4 ${card.isPinned ? 'fill-current' : ''}`} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(card);
          }}
          className="p-1.5 glass hover:bg-white dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md shadow-sm transition-colors"
          title="编辑"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(card);
          }}
          className="p-1.5 glass hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/50 dark:hover:text-red-400 text-slate-800 dark:text-slate-200 rounded-md shadow-sm transition-colors"
          title="删除"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Thumbnail Area */}
      <div className="w-full h-32 relative bg-slate-100 dark:bg-slate-900 overflow-hidden">
        {!showFallback ? (
          <img
            src={card.thumb}
            alt={card.name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center text-white"
            style={{ backgroundColor: card.color || '#4F46E5' }}
          >
            <span className="text-4xl font-bold uppercase tracking-wider opacity-90 drop-shadow-sm">
              {card.domain.substring(0, 2)}
            </span>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-3 flex flex-col flex-grow">
        <div className="flex items-start justify-between mb-0.5">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-1 flex-1 pr-2" title={card.name}>
            {card.name}
          </h3>
          <span className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded shrink-0">
            {timeAgo(card.updatedAt || card.createdAt)}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1.5 truncate" title={card.domain}>
          {card.domain}
        </p>

        {card.desc && (
          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 w-full mb-2 flex-grow leading-relaxed" title={card.desc}>
            {card.desc}
          </p>
        )}

        <div className="mt-auto pt-2 flex flex-wrap gap-1">
          {card.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-xs rounded-md font-medium"
            >
              {tag}
            </span>
          ))}
          {card.tags.length > 3 && (
            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs rounded-md font-medium">
              +{card.tags.length - 3}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
