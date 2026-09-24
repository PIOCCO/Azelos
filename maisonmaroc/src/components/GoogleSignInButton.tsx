import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { useLocale } from "../lib/useLocale";

type CredentialResponse = { credential?: string };

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: CredentialResponse) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: string;
              theme?: string;
              size?: string;
              text?: string;
              width?: number | string;
              locale?: string;
            },
          ) => void;
        };
      };
    };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadGoogleIdentityScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Google script failed")));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google script failed"));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export default function GoogleSignInButton({
  clientId,
  onCredential,
  onError,
}: {
  clientId: string;
  onCredential: (idToken: string) => void;
  onError?: (message: string) => void;
}) {
  const { lang } = useLocale();
  const hostRef = useRef<HTMLDivElement>(null);
  const onCredentialRef = useRef(onCredential) as MutableRefObject<(t: string) => void>;
  const onErrorRef = useRef(onError);
  onCredentialRef.current = onCredential;
  onErrorRef.current = onError;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadGoogleIdentityScript()
      .then(() => {
        if (cancelled || !hostRef.current || !window.google?.accounts?.id) return;
        hostRef.current.innerHTML = "";
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response.credential) onCredentialRef.current(response.credential);
            else onErrorRef.current?.("Google sign-in failed");
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        window.google.accounts.id.renderButton(hostRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          width: hostRef.current.offsetWidth || 320,
          locale: lang === "fr" ? "fr" : "ar",
        });
        setReady(true);
      })
      .catch(() => onErrorRef.current?.("Could not load Google Sign-In"));

    return () => {
      cancelled = true;
    };
  }, [clientId, lang]);

  return (
    <div className="w-full">
      <div ref={hostRef} className="flex min-h-[44px] w-full justify-center [&>div]:w-full" />
      {!ready && (
        <div className="flex min-h-[44px] w-full items-center justify-center rounded-lg border border-ink-200 bg-ink-50 text-sm text-ink-500">
          Google…
        </div>
      )}
    </div>
  );
}
