import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { IoGlobeOutline, IoChevronDown } from 'react-icons/io5';
import { useTranslation } from '@/hooks/useTranslation';
import { ALL_REGIONS, RegionPricing } from '../utils/regionalPricing';

interface RegionSelectorProps {
  selectedRegion: RegionPricing;
  onSelectRegion: (region: RegionPricing) => void;
}

export const RegionSelector: React.FC<RegionSelectorProps> = ({
  selectedRegion,
  onSelectRegion,
}) => {
  const _ = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className='relative inline-block text-left' ref={dropdownRef}>
      <button
        type='button'
        onClick={() => setIsOpen((prev) => !prev)}
        className={clsx(
          'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
          'bg-base-200 text-base-content/80 hover:text-base-content hover:bg-base-300',
          'transition-colors duration-150 eink-bordered',
          'focus-visible:ring-base-content/15 focus-visible:outline-hidden focus-visible:ring-2',
        )}
        aria-expanded={isOpen}
        aria-haspopup='listbox'
        aria-label={_('Select pricing region')}
      >
        <IoGlobeOutline className='h-3.5 w-3.5 opacity-70' />
        <span>
          {selectedRegion.flag} {selectedRegion.name} ({selectedRegion.currency})
        </span>
        <IoChevronDown className={clsx('h-3 w-3 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div
          className={clsx(
            'absolute right-0 z-50 mt-1.5 w-64 origin-top-right rounded-xl',
            'bg-base-100 border border-base-200 shadow-lg eink-bordered',
            'max-h-80 overflow-y-auto p-1.5',
          )}
          role='listbox'
        >
          <div className='px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-base-content/50'>
            {_('Pricing Region')}
          </div>
          {ALL_REGIONS.map((region) => {
            const isSelected = region.regionCode === selectedRegion.regionCode;
            return (
              <button
                key={region.regionCode}
                role='option'
                aria-selected={isSelected}
                onClick={() => {
                  onSelectRegion(region);
                  setIsOpen(false);
                }}
                className={clsx(
                  'flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-left',
                  'transition-colors duration-100',
                  isSelected
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-base-content/80 hover:bg-base-200 hover:text-base-content',
                )}
              >
                <div className='flex items-center gap-2'>
                  <span className='text-sm'>{region.flag}</span>
                  <span className='truncate'>{region.name}</span>
                </div>
                <div className='flex items-center gap-1.5 text-xs'>
                  <span className='font-mono font-medium'>{region.monthly.formatted}/mo</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RegionSelector;
