import { useState } from "react";
import { X } from "lucide-react";
import { C, inputStyle, labelStyle } from "../theme";

export default function AddPaymentForm({ members, onClose, onSave }) {
  const [from, setFrom] = useState(members[0]?.id || "");
  const [to, setTo] = useState(members.find((m) => m.id !== members[0]?.id)?.id || "");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const amt = Math.round((parseFloat(amount) || 0) * 100) / 100;
  const valid = from && to && from !== to && amt > 0;

  const changeFrom = (id) => {
    setFrom(id);
    if (to === id) setTo(members.find((m) => m.id !== id)?.id || "");
  };

  const submit = async () => {
    if (!valid || saving) return;
    setSaving(true);
    await onSave({ from, to, amount: amt, note: note.trim() });
    setSaving(false);
  };

  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: "14px",
        padding: "16px",
        marginBottom: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="display" style={{ fontSize: "15px", fontWeight: 700 }}>
          Record a payment
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: C.textMuted }}>
          <X size={18} />
        </button>
      </div>

      <div>
        <div style={labelStyle}>From</div>
        <select style={inputStyle} value={from} onChange={(e) => changeFrom(e.target.value)}>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div style={labelStyle}>To</div>
        <select style={inputStyle} value={to} onChange={(e) => setTo(e.target.value)}>
          {members
            .filter((m) => m.id !== from)
            .map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
        </select>
      </div>

      <div>
        <div style={labelStyle}>Amount</div>
        <input style={inputStyle} className="mono" type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
      </div>

      <div>
        <div style={labelStyle}>Note (optional)</div>
        <input style={inputStyle} value={note} onChange={(e) => setNote(e.target.value)} placeholder="cash, bank transfer…" />
      </div>

      <button
        onClick={submit}
        disabled={!valid || saving}
        style={{
          background: valid ? C.amber : C.surfaceAlt,
          color: valid ? C.ink : C.textMuted,
          border: "none",
          borderRadius: "10px",
          padding: "11px",
          fontWeight: 600,
          fontSize: "14px",
        }}
      >
        {saving ? "Saving…" : "Save payment"}
      </button>
    </div>
  );
}
