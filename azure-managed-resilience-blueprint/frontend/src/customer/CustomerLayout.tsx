import { Link, Outlet, useLocation } from "react-router-dom";
import { PRODUCT_NAME } from "../brand";
import { useApp } from "../context/AppContext";

const links = [
  { to: "/customer", label: "Overview" },
  { to: "/customer/financial", label: "Financial · Overview" },
  { to: "/customer/financial/services", label: "Financial · By Service" },
  { to: "/customer/financial/resources", label: "Financial · By Resource" },
  { to: "/customer/financial/trends", label: "Financial · Trends" },
  { to: "/customer/financial/savings", label: "Financial · Savings" },
  { to: "/customer/infrastructure", label: "Infrastructure" },
  { to: "/customer/resilience", label: "Resilience" },
  { to: "/customer/backups", label: "Backups" },
  { to: "/customer/dr", label: "Disaster Recovery" },
  { to: "/customer/security", label: "Security" },
  { to: "/customer/alerts", label: "Alerts" },
  { to: "/customer/recommendations", label: "Recommendations" },
  { to: "/customer/reports", label: "Reports" },
  { to: "/customer/settings", label: "Settings" },
];

export default function CustomerLayout() {
  const { meta } = useApp();
  const loc = useLocation();
  return (
    <div className="layout customer-layout">
      <aside>
        <h1>{PRODUCT_NAME}</h1>
        <p className="muted">Customer portal</p>
        {meta?.demo_mode && <div className="demo-badge">Demo environment</div>}
        <nav>
          {links.map((l) => (
            <Link key={l.to} to={l.to} className={loc.pathname === l.to ? "active" : ""}>
              {l.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
