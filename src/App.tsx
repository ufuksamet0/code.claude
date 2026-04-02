import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { UpdateChecker } from "./components/UpdateChecker";
import { AgentsPage } from "./pages/AgentsPage";
import { CodePage } from "./pages/CodePage";
import { PhotoPage } from "./pages/PhotoPage";
import { PcPage } from "./pages/PcPage";
import { SettingsPage } from "./pages/SettingsPage";
import { TestPage } from "./pages/TestPage";
import { VideoPage } from "./pages/VideoPage";

export default function App() {
  return (
    <>
      <UpdateChecker />
    <Routes>
      <Route path="/" element={<Navigate to="/code" replace />} />
      <Route element={<AppShell />}>
        <Route path="code" element={<CodePage />} />
        <Route path="video" element={<VideoPage />} />
        <Route path="photo" element={<PhotoPage />} />
        <Route path="agents" element={<AgentsPage />} />
        <Route path="pc" element={<PcPage />} />
        <Route path="test" element={<TestPage />} />
      </Route>
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/code" replace />} />
    </Routes>
    </>
  );
}
