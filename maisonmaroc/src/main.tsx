import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./i18n";
import "./index.css";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import { appBasename } from "./lib/appBase";
import { FavoritesProvider } from "./context/FavoritesContext";
import { AuthProvider } from "./context/AuthContext";
import { ListingsProvider } from "./context/ListingsContext";
import { MessagingProvider } from "./context/MessagingContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={appBasename()}>
      <AuthProvider>
        <MessagingProvider>
          <ListingsProvider>
            <FavoritesProvider>
              <ErrorBoundary>
                <App />
              </ErrorBoundary>
            </FavoritesProvider>
          </ListingsProvider>
        </MessagingProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
