import Image from 'next/image';
import type { SupabaseClient } from '@supabase/supabase-js';
import { FcGoogle } from 'react-icons/fc';
import { FaApple, FaGithub, FaDiscord } from 'react-icons/fa';
import { useTranslation } from '@/hooks/useTranslation';
import { ProviderLogin, type OAuthProvider } from './ProviderLogin';
import EmailPasswordAuth from './EmailPasswordAuth';

interface AuthPanelProps {
  supabaseClient: SupabaseClient;
  redirectTo?: string;
  magicLink?: boolean;
  onProviderSignIn: (provider: OAuthProvider) => Promise<void>;
}

export default function AuthPanel({
  supabaseClient,
  redirectTo,
  magicLink = false,
  onProviderSignIn,
}: AuthPanelProps) {
  const _ = useTranslation();

  return (
    <div className='flex w-full max-w-sm flex-col items-center gap-6'>
      <div className='flex flex-col items-center gap-3 text-center'>
        <Image src='/icon.png' alt='' width={56} height={56} className='eink-bordered rounded-xl' />
        <div>
          <h1 className='text-xl font-semibold tracking-tight'>
            {_('Sign in with your Biblophile account')}
          </h1>
          <p className='text-base-content/70 mt-1.5 text-sm leading-relaxed'>
            {_('Use your Biblophile account to sync your library and reading progress.')}
          </p>
          <p className='text-base-content/50 mt-2 text-xs'>
            {_("Don't have an account?")}{' '}
            <a
              href='https://biblophile.com'
              target='_blank'
              rel='noopener noreferrer'
              className='underline underline-offset-2 hover:text-base-content transition-colors'
            >
              {_('Sign up on Biblophile')}
            </a>
          </p>
        </div>
      </div>
      <div className='flex w-full flex-col gap-2.5'>
        <ProviderLogin
          provider='google'
          handleSignIn={onProviderSignIn}
          Icon={FcGoogle}
          label={_('Sign in with {{provider}}', { provider: 'Google' })}
        />
        <ProviderLogin
          provider='apple'
          handleSignIn={onProviderSignIn}
          Icon={FaApple}
          label={_('Sign in with {{provider}}', { provider: 'Apple' })}
        />
        <ProviderLogin
          provider='github'
          handleSignIn={onProviderSignIn}
          Icon={FaGithub}
          label={_('Sign in with {{provider}}', { provider: 'GitHub' })}
        />
        <ProviderLogin
          provider='discord'
          handleSignIn={onProviderSignIn}
          Icon={FaDiscord}
          label={_('Sign in with {{provider}}', { provider: 'Discord' })}
        />
      </div>
      <div className='flex w-full items-center gap-3' aria-hidden='true'>
        <hr className='border-base-300 flex-1 border-t' />
        <span className='text-base-content/50 text-xs'>{_('or continue with email')}</span>
        <hr className='border-base-300 flex-1 border-t' />
      </div>
      <EmailPasswordAuth
        supabaseClient={supabaseClient}
        redirectTo={redirectTo}
        magicLink={magicLink}
      />
    </div>
  );
}
