import { useEffect, useState } from "react";
import type { ApiConfig } from "./services/types";
import { useStorage, useUploader } from "./context/services";
import { ClipsProvider } from "./context/clips";
import { useClipManager } from "./services/clip-manager";
import { MainApp } from "./MainApp";

export default function App() {
  const storage = useStorage();
  const uploader = useUploader();
  const [api, setApi] = useState<ApiConfig>(() => {
    const saved = localStorage.getItem("voiceNotes.api");
    return saved
      ? JSON.parse(saved)
      : { baseUrl: "https://api.example.com", uploadPath: "/notes", authToken: "" };
  });

  useEffect(() => {
    localStorage.setItem("voiceNotes.api", JSON.stringify(api));
  }, [api]);

  const clipManager = useClipManager(api, storage, uploader);

  return (
    <ClipsProvider value={clipManager}>
      <MainApp api={api} onApiChange={setApi} />
    </ClipsProvider>
  );
}


