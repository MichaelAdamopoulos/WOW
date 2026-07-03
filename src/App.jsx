import { useState, useEffect, useMemo } from "react";
import { Users, Receipt, ArrowRightLeft, Plus, Trash2, X } from "lucide-react";

const C = {
  bg: "#14171A",
  surface: "#1C2023",
  surfaceAlt: "#20262A",
  paper: "#EDE6D6",
  paperDark: "#CFC5A8",
  ink: "#1C2023",
  textPrimary: "#F4F1EA",
  textMuted: "#8A9199",
  green: "#7FD99A",
  red: "#FF7A68",
  amber: "#F2C14E",
  border: "rgba(244,241,234,0.1)",
};

const AVATAR_COLORS = ["#7FD99A", "#F2C14E", "#FF7A68", "#6FB8E0", "#C792EA", "#F29E4C", "#6FE0C6"];

const fmt = (n) => {
  const v = Math.abs(n) < 0.005 ? 0 : n;
  return (v < 0 ? "-$" : "$") + Math.abs(v).toFixed(2);
};

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export default function TallyApp() {
  const [people, setPeople] = useState([]);
  const [bills, setBills] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("bills");
  const [newPersonName, setNewPersonName] = useState("");
  const [showAddBill, setShowAddBill] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = localStorage.getItem("tally-data");
        if (raw) {
          const d = JSON.parse(raw);
          setPeople(d.people || []);
          setBills(d.bills || []);
        }
        if (res && res.value) {
          const d = JSON.parse(res.value);
          setPeople(d.people || []);
          setBills(d.bills || []);
        }
      } catch (e) {
        // no data yet
      }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        localStorage.setItem("tally-data", JSON.stringify({ people, bills }));
      } catch (e) {
        console.error("save failed", e);
      }
    })();
  }, [people, bills, loaded]);

  const balances = useMemo(() => {
    const bal = {};
    people.forEach((p) => (bal[p.id] = 0));
    bills.forEach((b) => {
      bal[b.paidBy] = (bal[b.paidBy] || 0) + b.amount;
      Object.entries(b.splits).forEach(([pid, amt]) => {
        bal[pid] = (bal[pid] || 0) - amt;
      });
    });
    return bal;
  }, [people, bills]);

  const settlements = useMemo(() => {
    const creditors = [];
    const debtors = [];
    Object.entries(balances).forEach(([id, amt]) => {
      if (amt > 0.005) creditors.push({ id, amt });
      else if (amt < -0.005) debtors.push({ id, amt: -amt });
    });
    creditors.sort((a, b) => b.amt - a.amt);
    debtors.sort((a, b) => b.amt - a.amt);
    const tx = [];
    let i = 0,
      j = 0;
    while (i < debtors.length && j < creditors.length) {
      const d = debtors[i],
        c = creditors[j];
      const amt = Math.min(d.amt, c.amt);
      if (amt > 0.005) tx.push({ from: d.id, to: c.id, amount: amt });
      d.amt -= amt;
      c.amt -= amt;
      if (d.amt < 0.005) i++;
      if (c.amt < 0.005) j++;
    }
    return tx;
  }, [balances]);

  const personName = (id) => people.find((p) => p.id === id)?.name || "?";
  const personColor = (id) => people.find((p) => p.id === id)?.color || C.amber;

  const addPerson = () => {
    const name = newPersonName.trim();
    if (!name) return;
    setPeople([...people, { id: uid(), name, color: AVATAR_COLORS[people.length % AVATAR_COLORS.length] }]);
    setNewPersonName("");
  };

  const deletePerson = (id) => {
    const used = bills.some((b) => b.paidBy === id || b.participants.includes(id));
    if (used) return;
    setPeople(people.filter((p) => p.id !== id));
  };

  const deleteBill = (id) => setBills(bills.filter((b) => b.id !== id));

  return (
    <div
      style={{
        background: C.bg,
        color: C.textPrimary,
        minHeight: "600px",
        fontFamily: "'IBM Plex Sans', sans-serif",
        maxWidth: "440px",
        margin: "0 auto",
        position: "relative",
        borderRadius: "20px",
        overflow: "hidden",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.05)",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        .mono { font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }
        .display { font-family: 'Space Grotesk', sans-serif; }
        .scrollarea::-webkit-scrollbar { width: 0px; }
        input, select { font-family: inherit; }
        button { font-family: inherit; cursor: pointer; }
      `}</style>

      {/* Header */}
      <div style={{ padding: "24px 20px 16px", borderBottom: `1px solid ${C.border}` }}>
        <div className="display" style={{ fontSize: "26px", fontWeight: 700, letterSpacing: "-0.02em" }}>
          Who Owes Who
        </div>
        <div style={{ fontSize: "13px", color: C.textMuted, marginTop: "2px" }}>
          who paid, who owes, settled fast
        </div>
      </div>

      {/* Body */}
      <div className="scrollarea" style={{ padding: "16px 20px 90px", minHeight: "420px", overflowY: "auto" }}>
        {!loaded ? (
          <div style={{ color: C.textMuted, fontSize: "14px", padding: "40px 0", textAlign: "center" }}>
            Loading…
          </div>
        ) : tab === "people" ? (
          <PeopleTab
            people={people}
            balances={balances}
            newPersonName={newPersonName}
            setNewPersonName={setNewPersonName}
            addPerson={addPerson}
            deletePerson={deletePerson}
          />
        ) : tab === "bills" ? (
          <BillsTab
            people={people}
            bills={bills}
            personName={personName}
            personColor={personColor}
            deleteBill={deleteBill}
            showAddBill={showAddBill}
            setShowAddBill={setShowAddBill}
            setBills={setBills}
          />
        ) : (
          <BalancesTab people={people} balances={balances} settlements={settlements} personName={personName} personColor={personColor} />
        )}
      </div>

      {/* Bottom nav */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          display: "flex",
          background: C.surface,
          borderTop: `1px solid ${C.border}`,
        }}
      >
        {[
          { id: "bills", label: "Bills", icon: Receipt },
          { id: "balances", label: "Balances", icon: ArrowRightLeft },
          { id: "people", label: "People", icon: Users },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              padding: "12px 0 14px",
              background: "none",
              border: "none",
              color: tab === id ? C.amber : C.textMuted,
            }}
          >
            <Icon size={19} strokeWidth={tab === id ? 2.4 : 2} />
            <span style={{ fontSize: "11px", fontWeight: tab === id ? 600 : 400 }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Empty({ text }) {
  return (
    <div
      style={{
        border: `1px dashed ${C.border}`,
        borderRadius: "12px",
        padding: "28px 16px",
        textAlign: "center",
        color: C.textMuted,
        fontSize: "13.5px",
        marginTop: "8px",
      }}
    >
      {text}
    </div>
  );
}

function PeopleTab({ people, balances, newPersonName, setNewPersonName, addPerson, deletePerson }) {
  return (
    <div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <input
          value={newPersonName}
          onChange={(e) => setNewPersonName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addPerson()}
          placeholder="Friend's name"
          style={{
            flex: 1,
            background: C.surfaceAlt,
            border: `1px solid ${C.border}`,
            borderRadius: "10px",
            padding: "10px 12px",
            color: C.textPrimary,
            fontSize: "14px",
            outline: "none",
          }}
        />
        <button
          onClick={addPerson}
          style={{
            background: C.amber,
            color: C.ink,
            border: "none",
            borderRadius: "10px",
            padding: "0 16px",
            fontWeight: 600,
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {people.length === 0 && <Empty text="No friends yet. Add the first one above." />}

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {people.map((p) => {
          const bal = balances[p.id] || 0;
          return (
            <div
              key={p.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: "12px",
                padding: "10px 12px",
              }}
            >
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  background: p.color,
                  color: C.ink,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "14px",
                  flexShrink: 0,
                }}
              >
                {p.name.trim()[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1, fontSize: "14.5px", fontWeight: 500 }}>{p.name}</div>
              <div className="mono" style={{ fontSize: "13px", color: bal > 0.005 ? C.green : bal < -0.005 ? C.red : C.textMuted }}>
                {fmt(bal)}
              </div>
              <button
                onClick={() => deletePerson(p.id)}
                title="Remove (only if not used in any bill)"
                style={{ background: "none", border: "none", color: C.textMuted, padding: "4px" }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BillsTab({ people, bills, personName, personColor, deleteBill, showAddBill, setShowAddBill, setBills }) {
  return (
    <div>
      {!showAddBill && (
        <button
          onClick={() => setShowAddBill(true)}
          disabled={people.length === 0}
          style={{
            width: "100%",
            background: people.length === 0 ? C.surfaceAlt : C.amber,
            color: people.length === 0 ? C.textMuted : C.ink,
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

      {people.length === 0 && !showAddBill && <Empty text="Add a couple of friends first, then log a bill." />}

      {showAddBill && <AddBillForm people={people} onClose={() => setShowAddBill(false)} onSave={(b) => { setBills((prev) => [b, ...prev]); setShowAddBill(false); }} />}

      {!showAddBill && bills.length === 0 && people.length > 0 && <Empty text="No bills logged yet." />}

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {bills.map((b) => (
          <div
            key={b.id}
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: "12px",
              padding: "12px 14px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: "14.5px", fontWeight: 600 }}>{b.description}</div>
                <div style={{ fontSize: "12.5px", color: C.textMuted, marginTop: "2px" }}>
                  <span style={{ color: personColor(b.paidBy) }}>{personName(b.paidBy)}</span> paid · split{" "}
                  {b.splitMethod} among {b.participants.length}
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

function AddBillForm({ people, onClose, onSave }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(people[0]?.id || "");
  const [participants, setParticipants] = useState(people.map((p) => p.id));
  const [method, setMethod] = useState("equal");
  const [values, setValues] = useState({});

  const amt = parseFloat(amount) || 0;

  const toggleParticipant = (id) => {
    setParticipants((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const setValue = (id, v) => setValues((prev) => ({ ...prev, [id]: v }));

  const activeParticipants = people.filter((p) => participants.includes(p.id));

  const sumEntered = activeParticipants.reduce((s, p) => s + (parseFloat(values[p.id]) || 0), 0);

  let valid = description.trim() && amt > 0 && paidBy && activeParticipants.length > 0;
  if (method === "exact") valid = valid && Math.abs(sumEntered - amt) < 0.01;
  if (method === "percentage") valid = valid && Math.abs(sumEntered - 100) < 0.01;
  if (method === "shares") valid = valid && sumEntered > 0;

  const submit = () => {
    if (!valid) return;
    const splits = {};
    if (method === "equal") {
      const each = amt / activeParticipants.length;
      activeParticipants.forEach((p) => (splits[p.id] = each));
    } else if (method === "exact") {
      activeParticipants.forEach((p) => (splits[p.id] = parseFloat(values[p.id]) || 0));
    } else if (method === "percentage") {
      activeParticipants.forEach((p) => (splits[p.id] = (amt * (parseFloat(values[p.id]) || 0)) / 100));
    } else if (method === "shares") {
      const total = sumEntered;
      activeParticipants.forEach((p) => (splits[p.id] = (amt * (parseFloat(values[p.id]) || 0)) / total));
    }
    onSave({
      id: uid(),
      description: description.trim(),
      amount: amt,
      paidBy,
      participants: activeParticipants.map((p) => p.id),
      splitMethod: method,
      splits,
      date: Date.now(),
    });
  };

  const inputStyle = {
    width: "100%",
    background: C.surfaceAlt,
    border: `1px solid ${C.border}`,
    borderRadius: "10px",
    padding: "10px 12px",
    color: C.textPrimary,
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  };
  const labelStyle = { fontSize: "12px", color: C.textMuted, marginBottom: "6px", fontWeight: 500 };

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
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div style={labelStyle}>Split between</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {people.map((p) => {
            const on = participants.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggleParticipant(p.id)}
                style={{
                  border: `1px solid ${on ? p.color : C.border}`,
                  background: on ? p.color + "22" : "transparent",
                  color: on ? p.color : C.textMuted,
                  borderRadius: "20px",
                  padding: "6px 12px",
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                {p.name}
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
          {activeParticipants.map((p) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "70px", fontSize: "13px" }}>{p.name}</div>
              <input
                className="mono"
                type="number"
                inputMode="decimal"
                value={values[p.id] || ""}
                onChange={(e) => setValue(p.id, e.target.value)}
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
        disabled={!valid}
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
        Save bill
      </button>
    </div>
  );
}

function BalancesTab({ people, balances, settlements, personName, personColor }) {
  if (people.length === 0) return <Empty text="Add friends and bills to see balances." />;

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "20px" }}>
        {people.map((p) => {
          const bal = balances[p.id] || 0;
          return (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 2px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: p.color }} />
                {p.name}
              </div>
              <div className="mono" style={{ fontSize: "13.5px", color: bal > 0.005 ? C.green : bal < -0.005 ? C.red : C.textMuted }}>
                {bal > 0.005 ? "is owed " : bal < -0.005 ? "owes " : ""}
                {fmt(Math.abs(bal) < 0.005 ? 0 : bal)}
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
          position: "relative",
          backgroundImage:
            "repeating-linear-gradient(to bottom, transparent, transparent 27px, rgba(0,0,0,0.05) 27px, rgba(0,0,0,0.05) 28px)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-1px",
            left: 0,
            right: 0,
            height: "8px",
            background: `linear-gradient(-45deg, ${C.bg} 6px, transparent 0), linear-gradient(45deg, ${C.bg} 6px, transparent 0)`,
            backgroundSize: "12px 12px",
            backgroundRepeat: "repeat-x",
            transform: "translateY(-7px)",
          }}
        />
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
                  <span style={{ fontWeight: 600 }}>{personName(tx.from)}</span>
                  <span style={{ opacity: 0.55 }}> → </span>
                  <span style={{ fontWeight: 600 }}>{personName(tx.to)}</span>
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
