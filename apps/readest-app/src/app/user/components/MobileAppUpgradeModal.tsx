import React, { useState } from 'react';
import { FaApple, FaGooglePlay } from 'react-icons/fa';
import { IoCheckmarkCircle } from 'react-icons/io5';
import Dialog from '@/components/Dialog';
import { useTranslation } from '@/hooks/useTranslation';
import { detectUserRegion, RegionPricing, setStoredUserRegion } from '../utils/regionalPricing';
import RegionSelector from './RegionSelector';

interface MobileAppUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileAppUpgradeModal: React.FC<MobileAppUpgradeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const _ = useTranslation();
  const [selectedRegion, setSelectedRegion] = useState<RegionPricing>(() => detectUserRegion());

  const benefits = [
    _('10 GB Cloud Sync Storage across all devices'),
    _('150,000 AI Translation characters per day'),
    _('Unlimited AI Read Aloud & Offline Audio pre-downloading'),
    _('Sync with personal WebDAV, Google Drive, OneDrive, and S3'),
    _('Audiobookshelf full offline downloads'),
    _('Send-to-Yomi personal email address'),
    _('Nearby BookDrop trusted device pairing'),
    _('Unlock all premium themes, typography, and e-ink modes'),
  ];

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={_('Upgrade to Yomi Plus')}
      boxClassName='sm:w-[540px]! sm:max-w-[560px]! sm:h-auto! sm:max-h-[90vh]!'
      contentClassName='px-6! pb-6! pt-1!'
    >
      <div className='flex flex-col gap-4 py-1'>
        <div className='rounded-xl border border-[#D17842]/30 bg-[#D17842]/10 p-4 text-base-content'>
          <div className='text-sm leading-relaxed'>
            <span className='font-semibold'>{_('Unlock the ultimate reading experience.')}</span>{' '}
            <span className='text-base-content/80'>
              {_(
                'Subscriptions are managed securely through the Yomi iOS and Android apps to provide seamless billing in your local currency.',
              )}
            </span>
          </div>
          <div className='mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#D17842]/20 pt-2.5'>
            <div className='flex items-baseline gap-1.5'>
              <span className='font-bold text-[#D17842] text-base'>
                {selectedRegion.monthly.formatted}
              </span>
              <span className='text-xs text-base-content/70'>/{_('month')}</span>
              <span className='text-xs text-base-content/60'>
                ({selectedRegion.yearly.formatted}/{_('year')} ·{' '}
                {_('Save {{percent}}%', { percent: selectedRegion.savingsPercent })})
              </span>
            </div>
            <RegionSelector
              selectedRegion={selectedRegion}
              onSelectRegion={(r) => {
                setSelectedRegion(r);
                setStoredUserRegion(r.regionCode);
              }}
            />
          </div>
        </div>

        <div className='space-y-2.5 rounded-lg border border-base-200 bg-base-100 p-4'>
          <div className='text-xs font-semibold uppercase tracking-wider text-base-content/60'>
            {_('Included with Yomi Plus')}
          </div>
          <ul className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
            {benefits.map((benefit, idx) => (
              <li key={idx} className='flex items-start gap-2 text-xs text-base-content/80'>
                <IoCheckmarkCircle className='mt-0.5 h-4 w-4 shrink-0 text-[#D17842]' />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className='rounded-lg bg-base-200/60 p-3.5 text-center text-xs text-base-content/70'>
          {_(
            'Subscribe once on your mobile phone or tablet. All Plus features will automatically unlock here on Web and across all signed-in devices.',
          )}
        </div>

        <div className='flex flex-col gap-2.5 pt-1 sm:flex-row'>
          <a
            href='https://apps.apple.com'
            target='_blank'
            rel='noopener noreferrer'
            className='btn btn-outline flex-1 gap-2 normal-case'
          >
            <FaApple className='h-5 w-5' />
            <span>{_('Apple App Store')}</span>
          </a>
          <a
            href='https://play.google.com'
            target='_blank'
            rel='noopener noreferrer'
            className='btn btn-outline flex-1 gap-2 normal-case'
          >
            <FaGooglePlay className='h-4 w-4' />
            <span>{_('Google Play')}</span>
          </a>
        </div>
      </div>
    </Dialog>
  );
};

export default MobileAppUpgradeModal;
