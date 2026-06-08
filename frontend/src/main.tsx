import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl } from "./services";

// Initialize the API base URL from the environment variables.
const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env as any).NEXT_PUBLIC_API_URL || "";
if (apiUrl) {
  setBaseUrl(apiUrl);
}

createRoot(document.getElementById("root")!).render(<App />);
