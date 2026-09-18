import { useEffect, useMemo, useState, useCallback } from "react";
import { ArrowLeft, Receipt, ArrowRightLeft, Users } from "lucide-react";
import { supabase } from "./lib/supabaseClient";
import { C, AVATAR_COLORS } from "./theme";
import BillsTab from "./components/BillsTab";
import BalancesTab from "./components/BalancesTab";
import MembersTab from "./components/MembersTab";

export default function GroupWorkspace({ groupId, session, onBack }) {
  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState([]);
  const [bills, setBills] = useState([]);
  const [tab, setTab] = useState("bills");
  const [showAddBill, setShowAddBill] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchGroup = useCallback(async () => {
    const { data } = await supabase.from("groups").select("name").eq("id", groupId).single();
    if (data) setGroupName(data.name);
  }, [groupId]);

  const fetchMembers = useCallback(async () => {
    const { data } = await supabase.from("group_members").select("user_id, profiles(username)").eq("group_id", groupId);
    if (data) {
      setMembers(
        data
          .filter((r) => r.profiles)
          .map((r, i) => ({ id: r.user_id, name: r.profiles.username, color: AVATAR_COLORS[i % AVATAR_COLORS.length] }))
      );
    }
  }, [groupId]);

  const fetchBills = useCallback(async () => {
    const { data } = await supabase
      .from("bills")
      .select("id, description, amount, paid_by, split_method, created_at, bill_splits(user_id, amount)")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false });
    if (data) {
      setBills(
        data.map((b) => ({
          id: b.id,
          description: b.description,
          amount: b.amount,
          paidBy: b.paid_by,
          splitMethod: b.split_method,
          date: b.created_at,
          participants: b.bill_splits.map((s) => s.user_id),
          splits: Object.fromEntries(b.bill_splits.map((s) => [s.user_id, s.amount])),
        }))
      );
    }
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    fetchGroup();
    fetchMembers();
    fetchBills();

    const channel = supabase
      .channel(`group-${groupId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bills", filter: `group_id=eq.${groupId}` }, fetchBills)
      .on("postgres_changes", { event: "*", schema: "public", table: "bill_splits" }, fetchBills)
      .on("postgres_changes", { event: "*", schema: "public", table: "group_members", filter: `group_id=eq.${groupId}` }, fetchMembers)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [groupId, fetchGroup, fetchMembers, fetchBills]);

  const balances = useMemo(() => {
    const bal = {};
    members.forEach((m) => (bal[m.id] = 0));
    bills.forEach((b) => {
      bal[b.paidBy] = (bal[b.paidBy] || 0) + b.amount;
      Object.entries(b.splits).forEach(([uid, amt]) => {
        bal[uid] = (bal[uid] || 0) - amt;
      });
    });
    return bal;
  }, [members, bills]);

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

  const memberName = (id) => members.find((m) => m.id === id)?.name || "?";
  const memberColor = (id) => members.find((m) => m.id === id)?.color || C.amber;

  const saveBill = async (draft) => {
    const { data: billRow, error } = await supabase
      .from("bills")
      .insert({
        group_id: groupId,
        description: draft.description,
        amount: draft.amount,
        paid_by: draft.paidBy,
        split_method: draft.splitMethod,
        created_by: session.user.id,
      })
      .select()
      .single();
    if (error) {
      alert(error.message);
      return;
    }
    const splitRows = Object.entries(draft.splits).map(([user_id, amount]) => ({ bill_id: billRow.id, user_id, amount }));
    const { error: splitError } = await supabase.from("bill_splits").insert(splitRows);
    if (splitError) alert(splitError.message);
    fetchBills();
  };

  const deleteBill = async (id) => {
    await supabase.from("bills").delete().eq("id", id);
    fetchBills();
  };

  return (
    <div
      style={{
        background: C.bg,
        color: C.textPrimary,
        minHeight: "100vh",
        fontFamily: "'IBM Plex Sans', sans-serif",
        maxWidth: "440px",
        margin: "0 auto",
        position: "relative",
      }}
    >
      <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: "10px" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.textMuted, padding: "4px" }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <div className="display" style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.02em" }}>
            {groupName || "…"}
          </div>
          <div style={{ fontSize: "12.5px", color: C.textMuted }}>
            {members.length} {members.length === 1 ? "member" : "members"}
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 20px 90px", minHeight: "420px" }}>
        {loading ? (
          <div style={{ color: C.textMuted, fontSize: "14px", padding: "40px 0", textAlign: "center" }}>Loading…</div>
        ) : tab === "bills" ? (
          <BillsTab
            members={members}
            bills={bills}
            memberName={memberName}
            memberColor={memberColor}
            deleteBill={deleteBill}
            showAddBill={showAddBill}
            setShowAddBill={setShowAddBill}
            saveBill={saveBill}
          />
        ) : tab === "balances" ? (
          <BalancesTab members={members} balances={balances} settlements={settlements} memberName={memberName} />
        ) : (
          <MembersTab groupId={groupId} members={members} />
        )}
      </div>

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: "440px", margin: "0 auto", display: "flex", background: C.surface, borderTop: `1px solid ${C.border}` }}>
        {[
          { id: "bills", label: "Bills", icon: Receipt },
          { id: "balances", label: "Balances", icon: ArrowRightLeft },
          { id: "members", label: "Members", icon: Users },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", padding: "12px 0 14px", background: "none", border: "none", color: tab === id ? C.amber : C.textMuted }}
          >
            <Icon size={19} strokeWidth={tab === id ? 2.4 : 2} />
            <span style={{ fontSize: "11px", fontWeight: tab === id ? 600 : 400 }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
