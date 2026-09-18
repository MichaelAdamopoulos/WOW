import { useState } from "react";
import { X } from "lucide-react";
import { C, inputStyle, labelStyle, fmt } from "../theme";

export default function AddBillForm({ members, onClose, onSave }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(members[0]?.id || "");
  const [participants, setParticipants] = useState(members.map((m) => m.id));
  const [method, setMethod] = useState("equal");
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);

  const amt = parseFloat(amount) || 0;

  const toggleParticipant = (id) => {
    setParticipants((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const setValue = (id, v) => setValues((prev) => ({ ...prev, [id]: v }));

  const activeParticipants = members.filter((m) => participants.includes(m.id));
  const sumEntered = activeParticipants.reduce((s, m) => s + (parseFloat(values[m.id]) || 0), 0);

  let valid = description.trim() && amt > 0 && paidBy && activeParticipants.length > 0;
  if (method === "exact") valid = valid && Math.abs(sumEntered - amt) < 0.01;
  if (method === "percentage") valid = valid && Math.abs(sumEntered - 100) < 0.01;
  if (method === "shares") valid = valid && sumEntered > 0;

  const submit = async () => {
    if (!valid || saving) return;
    const splits = {};
    if (method === "equal") {
      const each = amt / activeParticipants.length;
      activeParticipants.forEach((m) => (splits[m.id] = each));
    } else if (method === "exact") {
      activeParticipants.forEach((m) => (splits[m.id] = parseFloat(values[m.id]) || 0));
    } else if (method === "percentage") {
      activeParticipants.forEach((m) => (splits[m.id] = (amt * (parseFloat(values[m.id]) || 0)) / 100));
    } else if (method === "shares") {
      const total = sumEntered;
      activeParticipants.forEach((m) => (splits[m.id] = (amt * (parseFloat(values[m.id]) || 0)) / total));
    }
    setSaving(true);
    await onSave({
      description: description.trim(),
      amount: amt,
      paidBy,
      splitMethod: method,
      splits,
    });
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
          New bill
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: C.textMuted }}>
          <X size={18} />
        </button>
      </div>

      <div>
        <div style={labelStyle}>What was it for</div>
        <input style={inputStyle} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Dinner, groceries, cab…" />
      </div>

      <div>
        <div style={labelStyle}>Amount</div>
        <input style={inputStyle} className="mono" type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
      </div>

      <div>
        <div style={labelStyle}>Paid by</div>
        <select style={inputStyle} value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div style={labelStyle}>Split between</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {members.map((m) => {
            const on = participants.includes(m.id);
            return (
              <button
                key={m.id}
                onClick={() => toggleParticipant(m.id)}
                style={{
                  border: `1px solid ${on ? m.color : C.border}`,
                  background: on ? m.color + "22" : "transparent",
                  color: on ? m.color : C.textMuted,
                  borderRadius: "20px",
                  padding: "6px 12px",
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                {m.name}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div style={labelStyle}>Split method</div>
        <select style={inputStyle} value={method} onChange={(e) => setMethod(e.target.value)}>
          <option value="equal">Equally</option>
          <option value="exact">Exact amounts</option>
          <option value="percentage">Percentages</option>
          <option value="shares">Shares (e.g. 2x for one person)</option>
        </select>
      </div>

      {method === "equal" && amt > 0 && activeParticipants.length > 0 && (
        <div style={{ fontSize: "13px", color: C.textMuted }} className="mono">
          {fmt(amt / activeParticipants.length)} each
        </div>
      )}

      {method !== "equal" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {activeParticipants.map((m) => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "70px", fontSize: "13px" }}>{m.name}</div>
              <input
                className="mono"
                type="number"
                inputMode="decimal"
                value={values[m.id] || ""}
                onChange={(e) => setValue(m.id, e.target.value)}
                placeholder={method === "percentage" ? "%" : method === "shares" ? "shares" : "0.00"}
                style={{ ...inputStyle, flex: 1, padding: "8px 10px" }}
              />
            </div>
          ))}
          <div style={{ fontSize: "12px", color: valid ? C.green : C.red }} className="mono">
            {method === "exact" && `Sum: ${fmt(sumEntered)} / ${fmt(amt)}`}
            {method === "percentage" && `Sum: ${sumEntered.toFixed(1)}% / 100%`}
            {method === "shares" && `Total shares: ${sumEntered || 0}`}
          </div>
        </div>
      )}

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
        {saving ? "Saving…" : "Save bill"}
      </button>
    </div>
  );
}
