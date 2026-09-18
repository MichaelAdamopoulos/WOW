import { useState } from "react";
import { UserPlus } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { C, inputStyle } from "../theme";

export default function MembersTab({ groupId, members }) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [inviting, setInviting] = useState(false);

  const invite = async () => {
    const uname = username.trim();
    if (!uname) return;
    setInviting(true);
    setError("");
    const { data: profile, error: lookupError } = await supabase.from("profiles").select("id").eq("username", uname).single();
    if (lookupError || !profile) {
      setError("No user with that username.");
      setInviting(false);
      return;
    }
    const { error: insertError } = await supabase.from("group_members").insert({ group_id: groupId, user_id: profile.id });
    if (insertError) {
      setError(insertError.code === "23505" ? "They're already in this group." : insertError.message);
    } else {
      setUsername("");
    }
    setInviting(false);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
        <input
          style={inputStyle}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && invite()}
          placeholder="Friend's username"
          autoCapitalize="none"
        />
        <button
          onClick={invite}
          disabled={inviting}
          style={{
            background: C.amber,
            color: C.ink,
            border: "none",
            borderRadius: "10px",
            padding: "0 14px",
            fontWeight: 600,
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            whiteSpace: "nowrap",
          }}
        >
          <UserPlus size={16} /> Invite
        </button>
      </div>
      {error && <div style={{ fontSize: "12.5px", color: C.red, marginBottom: "12px" }}>{error}</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
        {members.map((m) => (
          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "12px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "10px 12px" }}>
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                background: m.color,
                color: C.ink,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "14px",
                flexShrink: 0,
              }}
            >
              {m.name.trim()[0]?.toUpperCase()}
            </div>
            <div style={{ fontSize: "14.5px", fontWeight: 500 }}>{m.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
