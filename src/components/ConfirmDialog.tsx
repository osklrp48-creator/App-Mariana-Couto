interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirmar",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="center-overlay" onClick={onCancel}>
      <div className="center-card stack" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontSize: 18 }}>{title}</h3>
        <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>{message}</p>
        <div className="row">
          <button className="btn btn-outline btn-block" onClick={onCancel}>
            Cancelar
          </button>
          <button
            className={`btn btn-block ${danger ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
