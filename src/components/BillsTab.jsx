import { Plus, Trash2 } from "lucide-react";
import { C, fmt } from "../theme";
import AddBillForm from "./AddBillForm";

export default function BillsTab({ members, bills, memberName, memberColor, deleteBill, showAddBill, setShowAddBill, saveBill }) {
  return (
    <div>
      {!showAddBill && (
        <button
          onClick={() => setShowAddBill(true)}
          disabled={members.length === 0}
          style={{
            width: "100%",
            background: members.length === 0 ? C.surfaceAlt : C.amber,
            color: members.length === 0 ? C.textMuted : C.ink,
            border: "none",
            borderRadius: "10px",
            padding: "11px",
            fontWeight: 600,
            fontSize: "14px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
          }}
        >
          <Plus size={16} /> Add a bill
        </button>
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

      {!showAddBill && bills.length === 0 && <div style={{ color: C.textMuted, fontSize: "13.5px", textAlign: "center", padding: "20px 0" }}>No bills logged yet.</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {bills.map((b) => (
          <div key={b.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "12px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: "14.5px", fontWeight: 600 }}>{b.description}</div>
                <div style={{ fontSize: "12.5px", color: C.textMuted, marginTop: "2px" }}>
                  <span style={{ color: memberColor(b.paidBy) }}>{memberName(b.paidBy)}</span> paid · split {b.splitMethod} among {b.participants.length}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div className="mono" style={{ fontSize: "15px", fontWeight: 600 }}>
                  {fmt(b.amount)}
                </div>
                <button onClick={() => deleteBill(b.id)} style={{ background: "none", border: "none", color: C.textMuted }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
