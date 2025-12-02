"use client";

import { useEffect } from "react";

export default function Toast({ message, open = true, onClose }: { message: string; open?: boolean; onClose?: () => void }) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      onClose?.();
    }, 3200);
    return () => clearTimeout(t);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="toast" role="status" aria-live="polite">
      {message}
    </div>
  );
}
