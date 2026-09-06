import React, { useState, useRef, useEffect } from 'react';
import { FiChevronDown, FiCheck } from 'react-icons/fi';

export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select option...',
  className = '',
  renderOption = null,
  renderSelected = null,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format option objects
  const normalizedOptions = options.map(opt =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const selectedOpt = normalizedOptions.find(opt => opt.value === value) || {
    value,
    label: value || placeholder,
  };

  return (
    <div className={`relative select-none ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`w-full flex items-center justify-between gap-2.5 px-4 py-2.5 rounded-xl border text-xs lg:text-sm font-semibold transition-all duration-200 outline-none cursor-pointer ${
          isOpen
            ? 'bg-[#ffffff] dark:bg-[#151d30] border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/20 shadow-md text-slate-900 dark:text-slate-100'
            : 'bg-[#ffffff] dark:bg-[#0f172a] hover:bg-slate-50 dark:hover:bg-[#172033] border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 shadow-xs hover:border-slate-300 dark:hover:border-slate-600'
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          {renderSelected ? (
            renderSelected(selectedOpt)
          ) : (
            <>
              {selectedOpt.dot && (
                <span className={`w-2 h-2 rounded-full shrink-0 ${selectedOpt.dot}`} />
              )}
              {selectedOpt.badge ? (
                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border shrink-0 ${selectedOpt.badge}`}>
                  {selectedOpt.label}
                </span>
              ) : (
                <span className="truncate font-medium text-slate-900 dark:text-slate-100">{selectedOpt.label}</span>
              )}
            </>
          )}
        </div>
        <FiChevronDown
          size={16}
          className={`text-slate-400 dark:text-slate-400 transition-transform duration-300 shrink-0 ${
            isOpen ? 'rotate-180 text-blue-500 dark:text-blue-400' : ''
          }`}
        />
      </button>

      {/* Animated Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 z-[70] rounded-2xl bg-[#ffffff] dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 shadow-2xl p-1.5 space-y-1 max-h-60 overflow-y-auto overscroll-contain custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-150 ring-1 ring-black/5 dark:ring-white/5">
          {normalizedOptions.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-xs lg:text-sm font-medium transition-all text-left cursor-pointer group ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  {renderOption ? (
                    renderOption(opt)
                  ) : (
                    <>
                      {opt.dot && (
                        <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dot}`} />
                      )}
                      {opt.badge ? (
                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border shrink-0 ${opt.badge}`}>
                          {opt.label}
                        </span>
                      ) : (
                        <span>{opt.label}</span>
                      )}
                    </>
                  )}
                </div>
                {isSelected && (
                  <FiCheck size={15} className="text-blue-600 dark:text-blue-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
