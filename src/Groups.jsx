import { useEffect, useState } from "react";
import { Plus, LogOut, Users } from "lucide-react";
import { supabase } from "./lib/supabaseClient";
import { C, inputStyle } from "./theme";

export default function Groups({ session, onOpenGroup }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newGroupName, setNewGroupName] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchGroups = async () => {
    const { data, error } = await supabase
      .from("group_members")
      .select("group_id, groups(id, name)")
      .eq("user_id", session.user.id);
    if (!error && data) {
      setGroups(data.map((r) => r.groups).filter(Boolean));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGroups();
    const channel = supabase
      .channel("my-groups")
      .on("postgres_changes", { event: "*", schema: "public", table: "group_members" }, fetchGroups)
      .subscribe();
    return () => supabase.removeChannel(channel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createGroup = async () => {
    const name = newGroupName.trim();
    if (!name) return;
    setCreating(true);
    const { data: group, error } = await supabase
      .from("groups")
      .insert({ name, created_by: session.user.id })
      .select()
      .single();
    if (error) {
      alert(error.message);
    } else {
      const { error: memberError } = await supabase
        .from("group_members")
        .insert({ group_id: group.id, user_id: session.user.id });
      if (memberError) {
        alert(memberError.message);
      } else {
        setNewGroupName("");
        fetchGroups();
      }
    }
    setCreating(false);
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
        padding: "24px 20px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
        <div>
          <div className="display" style={{ fontSize: "26px", fontWeight: 700, letterSpacing: "-0.02em" }}>
            Your groups
          </div>
          <div style={{ fontSize: "13px", color: C.textMuted, marginTop: "2px" }}>pick one, or start a new one</div>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          title="Log out"
          style={{ background: "none", border: "none", color: C.textMuted, padding: "6px" }}
        >
          <LogOut size={18} />
        </button>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        <input
          style={inputStyle}
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createGroup()}
          placeholder="New group name (e.g. Roommates)"
        />
        <button
          onClick={createGroup}
          disabled={creating}
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
            whiteSpace: "nowrap",
          }}
        >
          <Plus size={16} /> Create
        </button>
      </div>

      {loading ? (
        <div style={{ color: C.textMuted, fontSize: "14px" }}>Loading…</div>
      ) : groups.length === 0 ? (
        <div
          style={{
            border: `1px dashed ${C.border}`,
            borderRadius: "12px",
            padding: "28px 16px",
            textAlign: "center",
            color: C.textMuted,
            fontSize: "13.5px",
          }}
        >
          No groups yet. Create one above to start tracking bills with friends.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => onOpenGroup(g.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: "12px",
                padding: "14px",
                color: C.textPrimary,
                fontSize: "14.5px",
                fontWeight: 500,
                textAlign: "left",
              }}
            >
              <Users size={18} color={C.amber} />
              {g.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
