import { useRef } from 'react';
import { X, Upload, Download, Info } from 'lucide-react';
import { useStore } from '../hooks/useStorage';
import { SiteCard } from '../types';

interface DataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DataModal({ isOpen, onClose }: DataModalProps) {
  const { cards, importData } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const dataStr = JSON.stringify(cards, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bookmarks_export_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          importData(json as SiteCard[]);
          alert(`成功导入 ${json.length} 条数据 (已自动去重)！`);
          onClose();
        } else {
          alert("文件格式不正确，期望一个 JSON 数组。");
        }
      } catch (err) {
        alert("解析 JSON 失败，请确保文件是有效的 JSON 格式。");
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div 
        className="glass w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            数据流转与备份
          </h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-lg p-3 flex gap-3 text-sm">
            <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <div className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
              <p className="font-medium text-slate-800 dark:text-slate-200 mb-0.5 text-sm">数据资产完全属于你</p>
              所有收藏数据均保存在您的浏览器本地（localStorage），通过导出功能可以备份或在不同设备间迁移数据（采用 JSON 标准格式）。
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleExport}
              className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-800/50 transition-colors">
                <Download className="w-6 h-6 text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
              </div>
              <span className="font-medium text-slate-700 dark:text-slate-200">导出数据</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-emerald-100 dark:group-hover:bg-emerald-800/50 transition-colors">
                <Upload className="w-6 h-6 text-slate-600 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
              </div>
              <span className="font-medium text-slate-700 dark:text-slate-200">导入数据</span>
            </button>
            <input 
              type="file" 
              accept=".json" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleImport} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
