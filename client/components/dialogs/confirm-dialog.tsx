'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/lib/stores/ui-store';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmDialogPayload {
  title?: string;
  description?: string;
  warning?: string;
  confirmLabel?: string;
  confirmVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  onConfirm?: () => Promise<void> | void;
}

export function ConfirmDialog() {
  const { activeDialog, dialogPayload, closeDialog } = useUIStore();
  const isOpen = activeDialog === 'confirm';
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen || !dialogPayload) return null;

  const {
    title = 'Are you sure?',
    description,
    warning,
    confirmLabel = 'Confirm',
    confirmVariant = 'destructive',
    onConfirm
  } = dialogPayload as ConfirmDialogPayload;

  const handleConfirm = async () => {
    if (isLoading) return;

    if (onConfirm) {
      try {
        setIsLoading(true);
        await onConfirm();
      } catch (err) {
        console.error('Error during confirmation action:', err);
      } finally {
        setIsLoading(false);
        closeDialog();
      }
    } else {
      closeDialog();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && closeDialog()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm text-foreground">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            {title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {warning && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">
            {warning}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={closeDialog} disabled={isLoading} className="cursor-pointer">
            Cancel
          </Button>
          <Button
            variant={(confirmVariant || 'destructive') as 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'}
            onClick={handleConfirm}
            disabled={isLoading}
            className="gap-1.5 cursor-pointer"
          >
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>{isLoading ? 'Processing...' : confirmLabel}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
