import React, { useState } from 'react';
import { getBarcodeStripePattern } from '../utils/barcode';
import { Barcode, Copy, Check, Edit2 } from 'lucide-react';

interface BarcodeBadgeProps {
  barcode?: string;
  onEdit?: (currentBarcode: string) => void;
  showVisualBars?: boolean;
  size?: 'sm' | 'md' | 'lg';
  allowCopy?: boolean;
}

export const BarcodeBadge: React.FC<BarcodeBadgeProps> = ({
  barcode,
  onEdit,
  showVisualBars = true,
  size = 'sm',
  allowCopy = true,
}) => {
  const [copied, setCopied] = useState(false);

  if (!barcode) {
    return (
      <div className="flex items-center gap-1.5 text-neutral-500 text-xs">
        <Barcode className="h-3.5 w-3.5 opacity-50" />
        <span className="italic">未設條碼</span>
        {onEdit && (
          <button
            onClick={() => onEdit('')}
            className="text-[11px] text-pink-400 hover:text-pink-300 underline ml-1"
          >
            +設定
          </button>
        )}
      </div>
    );
  }

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(barcode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stripePattern = getBarcodeStripePattern(barcode);

  return (
    <div className="inline-flex flex-col items-start gap-1 group/bar">
      {showVisualBars && (
        <div className="bg-white px-2 py-1 rounded shadow-sm flex flex-col items-center border border-neutral-300 select-none">
          {/* SVG Barcode stripes */}
          <div className="flex items-stretch h-5 gap-[1px]">
            {stripePattern.map((width, idx) => {
              const isBar = idx % 2 === 0;
              return (
                <div
                  key={idx}
                  style={{ width: `${width * (size === 'lg' ? 2 : 1.2)}px` }}
                  className={`${isBar ? 'bg-black' : 'bg-transparent'} h-full shrink-0`}
                />
              );
            })}
          </div>
          <span className="font-mono text-[10px] tracking-wider text-black font-semibold mt-0.5">
            {barcode}
          </span>
        </div>
      )}

      {!showVisualBars && (
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs text-neutral-200 bg-neutral-950 border border-neutral-800 px-2 py-0.5 rounded flex items-center gap-1">
            <Barcode className="h-3.5 w-3.5 text-pink-400" />
            <span>{barcode}</span>
          </span>

          {allowCopy && (
            <button
              onClick={handleCopy}
              title="複製條碼"
              className="text-neutral-500 hover:text-neutral-300 p-0.5"
            >
              {copied ? (
                <Check className="h-3 w-3 text-emerald-400" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          )}

          {onEdit && (
            <button
              onClick={() => onEdit(barcode)}
              title="修改條碼"
              className="text-neutral-500 hover:text-pink-400 p-0.5 opacity-0 group-hover/bar:opacity-100 transition-opacity"
            >
              <Edit2 className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
