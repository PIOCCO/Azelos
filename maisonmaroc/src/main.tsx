import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./i18n";
import "./index.css";
import App from "./App";
import { FavoritesProvider } from "./context/FavoritesContext";
import { AuthProvider } from "./context/AuthContext";
import { ListingsProvider } from "./context/ListingsContext";

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, "") || undefined;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={routerBasename}>
      <AuthProvider>
        <ListingsProvider>
          <FavoritesProvider>
            <App />
          </FavoritesProvider>
        </ListingsProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
