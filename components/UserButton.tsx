'use client';

import { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { LogOut } from 'lucide-react';

import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Spinner,
} from '@/components/ui';

import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

import { getDisplayName } from '@/utils/user';

interface UserButtonProps {
  user: User;
  /** Called after logging out, e.g. to close the mobile menu. */
  onLoggedOut?: () => void;
  className?: string;
}

/** The signed-in user's name with a logout icon. Clicking it asks to confirm logging out. */
export function UserButton({ user, onLoggedOut, className }: UserButtonProps) {
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const name = getDisplayName(user);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      // Redirects to /login and refreshes Server Components.
      await signOut();
      setOpen(false);
      onLoggedOut?.();
      toast.success('You have been logged out.');
    } catch {
      toast.error('There was an issue logging you out.');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant='outline' className={className} />}
        aria-label={`Log out ${name}`}
      >
        <span className='max-w-40 truncate'>{name}</span>
        <LogOut />
      </DialogTrigger>
      <DialogContent className='sm:max-w-106.25'>
        <DialogHeader>
          <DialogTitle>Log out?</DialogTitle>
          <DialogDescription>
            You&apos;re signed in as <strong>{user.email ?? name}</strong>. You&apos;ll
            need to sign in again to get back in.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant='outline' disabled={loggingOut} />}>
            Cancel
          </DialogClose>
          <Button variant='destructive' onClick={handleLogout} disabled={loggingOut}>
            {loggingOut ? <Spinner /> : <LogOut />} Log out
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
