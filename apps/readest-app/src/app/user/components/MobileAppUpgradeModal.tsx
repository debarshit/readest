import React from 'react';
import { FaApple, FaGooglePlay } from 'react-icons/fa';
import { IoCheckmarkCircle, IoSparkles } from 'react-icons/io5';
import Dialog from '@/components/Dialog';
import { useTranslation } from '@/hooks/useTranslation';

interface MobileAppUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileAppUpgradeModal: React.FC<MobileAppUpgradeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const _ = useTranslation();

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
      className='max-w-lg'
    >
      <div className='flex flex-col gap-5 p-2'>
        <div className='flex items-center gap-3 rounded-xl bg-sky-50 p-4 text-sky-900 dark:bg-sky-950/40 dark:text-sky-200'>
          <IoSparkles className='h-8 w-8 shrink-0 text-sky-600 dark:text-sky-400' />
          <div className='text-sm leading-relaxed'>
            <span className='font-semibold'>{_('Unlock the ultimate reading experience.')}</span>{' '}
            {_(
              'Subscriptions are managed securely through the Yomi iOS and Android apps to provide seamless billing in your local currency.',
            )}
          </div>
        </div>

        <div className='space-y-2.5 rounded-lg border border-base-200 bg-base-100 p-4'>
          <div className='text-xs font-semibold uppercase tracking-wider text-base-content/60'>
            {_('Included with Yomi Plus')}
          </div>
          <ul className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
            {benefits.map((benefit, idx) => (
              <li key={idx} className='flex items-start gap-2 text-xs text-base-content/80'>
                <IoCheckmarkCircle className='mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400' />
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
