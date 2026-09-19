import { useState } from "react";
import { supabase } from "./lib/supabaseClient";
import { C, inputStyle, labelStyle } from "./theme";

export default function Auth() {
  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const [username, setUsername] = useState("");
  const [identifier, setIdentifier] = useState(""); // login: username or email
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const resolveEmailForLogin = async (id) => {
    if (id.includes("@")) return id;
    const { data, error: rpcError } = await supabase.rpc("get_email_by_username", { uname: id });
    if (rpcError || !data) throw new Error("No account found with that username.");
    return data;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      if (mode === "signup") {
        if (!username.trim()) throw new Error("Pick a username.");
        if (password.length < 6) throw new Error("Password needs at least 6 characters.");
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        if (!data.session) {
          setNotice("Check your email to confirm your account, then log in.");
        }
        if (data.user) {
          const { error: profileError } = await supabase.from("profiles").insert({
            id: data.user.id,
            username: username.trim(),
            email,
          });
          if (profileError) {
            if (profileError.code === "23505") throw new Error("That username is already taken.");
            throw profileError;
          }
        }
      } else {
        const loginEmail = await resolveEmailForLogin(identifier.trim());
        const { error: loginError } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
        if (loginError) throw loginError;
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-screen">
      <div className="app-scroll" style={{ display: "flex", padding: "20px" }}>
        <form
          onSubmit={handleSubmit}
          style={{
            width: "100%",
            maxWidth: "360px",
            margin: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div>
            <div className="display" style={{ fontSize: "26px", fontWeight: 700, letterSpacing: "-0.02em" }}>
              Tally
            </div>
            <div style={{ fontSize: "13px", color: C.textMuted, marginTop: "2px" }}>
              {mode === "login" ? "Welcome back." : "Create your account."}
            </div>
          </div>

          {mode === "signup" && (
            <div>
              <div style={labelStyle}>Username</div>
              <input style={inputStyle} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. maria23" autoCapitalize="none" />
            </div>
          )}

          {mode === "login" ? (
            <div>
              <div style={labelStyle}>Username or email</div>
              <input style={inputStyle} value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoCapitalize="none" />
            </div>
          ) : (
            <div>
              <div style={labelStyle}>Email</div>
              <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          )}

          <div>
            <div style={labelStyle}>Password</div>
            <input style={inputStyle} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          {error && <div style={{ fontSize: "13px", color: C.red }}>{error}</div>}
          {notice && <div style={{ fontSize: "13px", color: C.green }}>{notice}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: C.amber,
              color: C.ink,
              border: "none",
              borderRadius: "10px",
              padding: "12px",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            {loading ? "Working…" : mode === "login" ? "Log in" : "Create account"}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError("");
              setNotice("");
            }}
            style={{ background: "none", border: "none", color: C.textMuted, fontSize: "13px", padding: "4px" }}
          >
            {mode === "login" ? "New here? Create an account" : "Already have an account? Log in"}
          </button>
        </form>
      </div>
    </div>
  );
}
