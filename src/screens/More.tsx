import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { ChevronDownIcon, FileTextIcon, SettingsIcon } from "../components/icons";
import { WalletIcon } from "../components/icons";

const items = [
  { to: "/tratamentos", label: "Tratamentos", desc: "Catálogo de serviços e valores", icon: WalletIcon },
  { to: "/relatorio", label: "Relatório mensal", desc: "Totais, gráficos e exportação em PDF", icon: FileTextIcon },
  { to: "/configuracoes", label: "Configurações", desc: "PIN, notificações e dados do app", icon: SettingsIcon },
];

export function More() {
  return (
    <div className="stack">
      <PageHeader title="Mais" />
      <div className="card" style={{ padding: 0 }}>
        {items.map((item) => (
          <Link key={item.to} to={item.to} className="list-item" style={{ padding: "14px 16px" }}>
            <div className="row" style={{ gap: 12 }}>
              <item.icon width={20} height={20} style={{ color: "var(--pine)" }} />
              <div>
                <p style={{ fontWeight: 600 }}>{item.label}</p>
                <p style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>{item.desc}</p>
              </div>
            </div>
            <ChevronDownIcon style={{ transform: "rotate(-90deg)", width: 18, height: 18, color: "var(--ink-faint)" }} />
          </Link>
        ))}
      </div>
    </div>
  );
}
