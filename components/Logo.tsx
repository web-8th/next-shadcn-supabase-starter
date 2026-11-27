import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Infinity } from 'lucide-react';

import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  iconSize?: number;
  showText?: boolean;
  onClick?: () => void;
}

// Demo branding: replace with your project's logo (see "Remove demo content" in README.md).
export function Logo({ className, iconSize = 20, showText = true, onClick }: LogoProps) {
  return (
    <div className='flex items-center gap-3'>
      <Button
        variant='link'
        className='p-0 m-0'
        nativeButton={false}
        render={
          <Link
            href='/'
            className={cn('flex items-center gap-2', className)}
            onClick={onClick}
          />
        }
      >
        <Image
          src='/favicon.ico'
          alt='Logo'
          width={iconSize}
          height={iconSize}
          className={cn('h-5 w-5')}
          style={{ width: iconSize, height: iconSize }}
        />
        {showText && <span className={className}>Next Starter</span>}
      </Button>

      <Infinity size={iconSize} className={cn('text-muted-foreground', className)} />
      <div className={cn('flex items-center gap-2', className)}>
        <Button
          variant='link'
          className='p-0 m-0'
          nativeButton={false}
          render={<Link href='https://web8th.com' />}
        >
          <Image
            className='not-dark:invert-100'
            src='/icons/8th_svg.svg'
            alt='8th'
            width={Math.round(iconSize * 1.5)}
            height={Math.round(iconSize * 1.5 * (1079 / 1905))}
            style={{ width: iconSize * 1.5, height: 'auto' }}
          />
        </Button>

        <ChevronRight
          size={iconSize}
          className={cn('text-muted-foreground', className)}
        />
        <Button
          variant='link'
          className='p-0 m-0'
          nativeButton={false}
          render={<Link href='https://rinm.dev' />}
        >
          <Image
            src='/rmlogov2.png'
            alt='rinm.dev'
            className='not-dark:invert-100'
            width={Math.round(iconSize * 1.5)}
            height={Math.round(iconSize * 1.5 * (1079 / 1905))}
            style={{ width: iconSize * 1.5, height: 'auto' }}
          />
        </Button>
      </div>
    </div>
  );
}
