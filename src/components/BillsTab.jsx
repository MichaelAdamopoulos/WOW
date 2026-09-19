import { useMemo } from "react";
import { Plus, Trash2, HandCoins, ArrowRight } from "lucide-react";
import { C, fmt } from "../theme";
import AddBillForm from "./AddBillForm";
import AddPaymentForm from "./AddPaymentForm";

const actionButton = (enabled, primary) => ({
  flex: "1 1 150px",
  background: !enabled ? C.surfaceAlt : primary ? C.amber : "transparent",
  color: !enabled ? C.textMuted : primary ? C.ink : C.textPrimary,
  border: primary || !enabled ? "none" : `1px solid ${C.border}`,
  borderRadius: "10px",
  padding: "11px",
  fontWeight: 600,
  fontSize: "14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
});

const cardStyle = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "12px 14px" };

function PaymentAvatar({ name, color }) {
  return (
    <div
      style={{
        width: "26px",
        height: "26px",
        borderRadius: "50%",
        background: color,
        color: C.ink,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: "12px",
        flexShrink: 0,
      }}
    >
      {name.trim()[0]?.toUpperCase()}
    </div>
  );
}

export default function BillsTab({
  members,
  bills,
  payments,
  memberName,
  memberColor,
  deleteBill,
  deletePayment,
  showAddBill,
  setShowAddBill,
  showAddPayment,
  setShowAddPayment,
  saveBill,
  savePayment,
}) {
  const feed = useMemo(
    () =>
      [...bills.map((b) => ({ ...b, type: "bill" })), ...payments.map((p) => ({ ...p, type: "payment" }))].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      ),
    [bills, payments]
  );

  const formOpen = showAddBill || showAddPayment;
  const canAddBill = members.length > 0;
  const canAddPayment = members.length > 1;

  return (
    <div>
      {!formOpen && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
          <button onClick={() => setShowAddBill(true)} disabled={!canAddBill} style={actionButton(canAddBill, true)}>
            <Plus size={16} /> Add a bill
          </button>
          <button onClick={() => setShowAddPayment(true)} disabled={!canAddPayment} style={actionButton(canAddPayment, false)}>
            <HandCoins size={16} /> Record a payment
          </button>
        </div>
      )}

      {showAddBill && (
        <AddBillForm
          members={members}
          onClose={() => setShowAddBill(false)}
          onSave={async (draft) => {
            await saveBill(draft);
            setShowAddBill(false);
          }}
        />
      )}

      {showAddPayment && (
        <AddPaymentForm
          members={members}
          onClose={() => setShowAddPayment(false)}
          onSave={async (draft) => {
            await savePayment(draft);
            setShowAddPayment(false);
          }}
        />
      )}

      {!formOpen && feed.length === 0 && <div style={{ color: C.textMuted, fontSize: "13.5px", textAlign: "center", padding: "20px 0" }}>No bills or payments logged yet.</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {feed.map((item) =>
          item.type === "bill" ? (
            <div key={`bill-${item.id}`} style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: "14.5px", fontWeight: 600 }}>{item.description}</div>
                  <div style={{ fontSize: "12.5px", color: C.textMuted, marginTop: "2px" }}>
                    <span style={{ color: memberColor(item.paidBy) }}>{memberName(item.paidBy)}</span> paid · split {item.splitMethod} among {item.participants.length}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div className="mono" style={{ fontSize: "15px", fontWeight: 600 }}>
                    {fmt(item.amount)}
                  </div>
                  <button onClick={() => deleteBill(item.id)} style={{ background: "none", border: "none", color: C.textMuted }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div key={`payment-${item.id}`} style={{ ...cardStyle, borderLeft: `3px solid ${C.green}`, display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "3px", flexShrink: 0 }}>
                <PaymentAvatar name={memberName(item.from)} color={memberColor(item.from)} />
                <ArrowRight size={13} color={C.textMuted} />
                <PaymentAvatar name={memberName(item.to)} color={memberColor(item.to)} />
              </div>
              <div style={{ flex: 1, minWidth: 0, fontSize: "13.5px", overflowWrap: "anywhere" }}>
                <span style={{ color: memberColor(item.from), fontWeight: 600 }}>{memberName(item.from)}</span> paid{" "}
                <span style={{ color: memberColor(item.to), fontWeight: 600 }}>{memberName(item.to)}</span>
                {item.note && <span style={{ color: C.textMuted }}> · {item.note}</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                <div className="mono" style={{ fontSize: "15px", fontWeight: 600, color: C.green }}>
                  {fmt(item.amount)}
                </div>
                <button onClick={() => deletePayment(item.id)} style={{ background: "none", border: "none", color: C.textMuted }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
