import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import { GlobalStyle } from "./theme";
import Auth from "./Auth";
import Groups from "./Groups";
import GroupWorkspace from "./GroupWorkspace";

export default function App() {
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCheckingSession(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (!newSession) setSelectedGroupId(null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (checkingSession) return null;

  return (
    <>
      <GlobalStyle />
      {!session ? (
        <Auth />
      ) : selectedGroupId ? (
        <GroupWorkspace groupId={selectedGroupId} session={session} onBack={() => setSelectedGroupId(null)} />
      ) : (
        <Groups session={session} onOpenGroup={setSelectedGroupId} />
      )}
    </>
  );
}
