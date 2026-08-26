import type { ReactNode } from "react";
import { XIcon } from "./icons";

interface SheetProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Sheet({ title, onClose, children }: SheetProps) {
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <h3 style={{ fontSize: 18 }}>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar">
            <XIcon />
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}
