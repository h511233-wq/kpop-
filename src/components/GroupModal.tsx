import React, { useState, useEffect } from 'react';
import { KPopGroup } from '../types/store';
import { X, Sparkles, Check } from 'lucide-react';

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (group: KPopGroup) => void;
  groupToEdit: KPopGroup | null;
}

const PRESET_COLORS = [
  '#ec4899', // Pink (BLACKPINK)
  '#ef4444', // Red (BABYMONSTER)
  '#f59e0b', // Amber/Gold (ATEEZ)
  '#8b5cf6', // Violet (aespa)
  '#06b6d4', // Cyan (NewJeans)
  '#f43f5e', // Rose Quartz (SEVENTEEN)
  '#10b981', // Emerald (Stray Kids)
  '#3b82f6', // Blue (IVE / TXT)
  '#a855f7', // Purple (BTS)
  '#f97316', // Orange
  '#6366f1', // Indigo
  '#14b8a6', // Teal
];

export const GroupModal: React.FC<GroupModalProps> = ({
  isOpen,
  onClose,
  onSave,
  groupToEdit,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(groupToEdit?.name || '');
  const [koreanName, setKoreanName] = useState(groupToEdit?.koreanName || '');
  const [agency, setAgency] = useState(groupToEdit?.agency || '');
  const [fandomName, setFandomName] = useState(groupToEdit?.fandomName || '');
  const [colorAccent, setColorAccent] = useState(groupToEdit?.colorAccent || '#ec4899');

  useEffect(() => {
    if (groupToEdit) {
      setName(groupToEdit.name);
      setKoreanName(groupToEdit.koreanName);
      setAgency(groupToEdit.agency);
      setFandomName(groupToEdit.fandomName);
      setColorAccent(groupToEdit.colorAccent);
    } else {
      setName('');
      setKoreanName('');
      setAgency('');
      setFandomName('');
      setColorAccent('#ec4899');
    }
  }, [groupToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const id = groupToEdit?.id || name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4);
    
    onSave({
      id,
      name: name.trim(),
      koreanName: koreanName.trim() || name.trim(),
      agency: agency.trim() || '自主管理',
      fandomName: fandomName.trim() || 'Fans',
      colorAccent,
      bgGradient: 'from-neutral-900 to-neutral-950',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: colorAccent }}
            />
            <h2 className="text-base font-bold text-white">
              {groupToEdit ? `修改 ${groupToEdit.name} 資料` : '新增 K-POP 偶像團體'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">
              團體英文/官方名稱 * (例: IVE, LE SSERAFIM, ENHYPEN)
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="例如: IVE, ZEROBASEONE..."
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-pink-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                韓文名稱
              </label>
              <input
                type="text"
                value={koreanName}
                onChange={e => setKoreanName(e.target.value)}
                placeholder="例如: 아이브"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-pink-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                所屬經紀公司
              </label>
              <input
                type="text"
                value={agency}
                onChange={e => setAgency(e.target.value)}
                placeholder="例如: Starship, HYBE..."
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-pink-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">
              官方粉絲名 (Fandom Name)
            </label>
            <input
              type="text"
              value={fandomName}
              onChange={e => setFandomName(e.target.value)}
              placeholder="例如: DIVE, FEARNOT, ENGENE..."
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-pink-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-2">
              官方代表色 / 主題色標記
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_COLORS.map(c => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColorAccent(c)}
                  className={`h-7 w-7 rounded-full border-2 transition-transform flex items-center justify-center ${
                    colorAccent === c ? 'scale-110 border-white shadow-md' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {colorAccent === c && <Check className="h-3.5 w-3.5 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white"
            >
              取消
            </button>
            <button
              type="submit"
              className="rounded-lg bg-pink-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-pink-600/30 hover:bg-pink-500"
            >
              {groupToEdit ? '儲存修改' : '確認新增團體'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
