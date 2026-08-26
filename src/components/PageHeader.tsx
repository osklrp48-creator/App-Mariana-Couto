import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeftIcon } from "./icons";

interface PageHeaderProps {
  title: string;
  back?: boolean;
  action?: ReactNode;
}

export function PageHeader({ title, back = false, action }: PageHeaderProps) {
  const navigate = useNavigate();
  return (
    <header className="app-header">
      <div className="row-between">
        <div className="row">
          {back && (
            <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Voltar">
              <ChevronLeftIcon />
            </button>
          )}
          <h1>{title}</h1>
        </div>
        {action}
      </div>
    </header>
  );
}
