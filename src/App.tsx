import { useEffect, useState } from "react";
import { supabase } from "./utils/supabase";
import type { ApiConfig } from "./services/types";
import { useStorage, useUploader } from "./context/services";
import { ClipsProvider } from "./context/clips";
import { useClipManager } from "./services/clip-manager";
import { MainApp } from "./MainApp";
import { LoginScreen } from "./components/LoginScreen";

export default function App() {
  const storage = useStorage();
  const uploader = useUploader();
  const [api, setApi] = useState<ApiConfig>(() => {
    const saved = localStorage.getItem("voiceNotes.api");
    return saved
      ? { ...JSON.parse(saved), authToken: "" }
      : { baseUrl: "https://api.example.com", uploadPath: "/notes", authToken: "" };
  });

  useEffect(() => {
    const { authToken, ...persisted } = api;
    localStorage.setItem("voiceNotes.api", JSON.stringify(persisted));
  }, [api.baseUrl, api.uploadPath]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setApi((prev) => ({ ...prev, authToken: session?.access_token || "" }));
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setApi((prev) => ({ ...prev, authToken: session?.access_token || "" }));
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const clipManager = useClipManager(api, storage, uploader);

  if (!api.authToken) {
    return <LoginScreen onLogin={(token) => setApi({ ...api, authToken: token })} />;
  }

  return (
    <ClipsProvider value={clipManager}>
      <MainApp api={api} onApiChange={setApi} />
    </ClipsProvider>
  );
}


