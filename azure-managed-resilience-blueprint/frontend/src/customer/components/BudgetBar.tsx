export function BudgetBar({ spent, budget }: { spent: number; budget: number }) {
  const pct = Math.min(100, Math.round((100 * spent) / budget));
  const filled = Math.round((pct / 100) * 20);
  const bar = "█".repeat(filled) + "░".repeat(20 - filled);
  return (
    <div className="card">
      <h3>Monthly budget</h3>
      <p>
        ${spent.toFixed(2)} / ${budget.toFixed(2)}
      </p>
      <pre className="budget-bar">{bar}</pre>
      <p className="muted">{pct}% used · ${(budget - spent).toFixed(2)} remaining</p>
    </div>
  );
}
