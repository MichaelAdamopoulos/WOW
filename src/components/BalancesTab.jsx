import { C, fmt } from "../theme";

export default function BalancesTab({ members, balances, settlements, memberName }) {
  if (members.length === 0) return <div style={{ color: C.textMuted, fontSize: "13.5px", textAlign: "center", padding: "20px 0" }}>Add members and bills to see balances.</div>;

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "20px" }}>
        {members.map((m) => {
          const bal = balances[m.id] || 0;
          return (
            <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 2px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: m.color }} />
                {m.name}
              </div>
              <div className="mono" style={{ fontSize: "13.5px", color: bal > 0.005 ? C.green : bal < -0.005 ? C.red : C.textMuted }}>
                {bal > 0.005 ? "is owed " : bal < -0.005 ? "owes " : ""}
                {fmt(Math.abs(bal))}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          background: C.paper,
          color: C.ink,
          borderRadius: "4px",
          padding: "18px 16px 20px",
          backgroundImage: "repeating-linear-gradient(to bottom, transparent, transparent 27px, rgba(0,0,0,0.05) 27px, rgba(0,0,0,0.05) 28px)",
        }}
      >
        <div className="display" style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.12em", marginBottom: "12px", opacity: 0.6 }}>
          SETTLE UP
        </div>

        {settlements.length === 0 ? (
          <div style={{ fontSize: "13.5px", opacity: 0.6 }}>Everyone's even. Nice.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {settlements.map((tx, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13.5px" }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{memberName(tx.from)}</span>
                  <span style={{ opacity: 0.55 }}> → </span>
                  <span style={{ fontWeight: 600 }}>{memberName(tx.to)}</span>
                </div>
                <div className="mono" style={{ fontWeight: 600 }}>
                  {fmt(tx.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
