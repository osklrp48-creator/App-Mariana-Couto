import { NavLink } from "react-router-dom";
import { CalendarIcon, HomeIcon, MoreIcon, UsersIcon, WalletIcon } from "./icons";

const items = [
  { to: "/", label: "Painel", icon: HomeIcon, end: true },
  { to: "/pacientes", label: "Pacientes", icon: UsersIcon, end: false },
  { to: "/agenda", label: "Agenda", icon: CalendarIcon, end: false },
  { to: "/financeiro", label: "Financeiro", icon: WalletIcon, end: false },
  { to: "/mais", label: "Mais", icon: MoreIcon, end: false },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          <item.icon />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
