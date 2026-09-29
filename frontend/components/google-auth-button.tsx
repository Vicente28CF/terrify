"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useAuth } from "@/components/auth-provider";
import { loginWithGoogle } from "@/lib/api";

let initializedClientId: string | null = null;

declare global {
  interface Window {
    __terrifyGoogleCredentialHandler?: (response: { credential?: string }) => void;
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            ux_mode?: "popup" | "redirect";
          }) => void;
          renderButton: (
            element: HTMLElement,
            config: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: string;
              shape?: "pill" | "rectangular" | "circle" | "square";
              logo_alignment?: "left" | "center";
              width?: string | number;
            },
          ) => void;
        };
      };
    };
  }
}

export function GoogleAuthButton() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!clientId) {
      return;
    }

    const googleClientId = clientId;
    let cancelled = false;

    window.__terrifyGoogleCredentialHandler = async (response) => {
      const credential = response.credential;

      if (!credential) {
        setError("No se pudo completar la autenticacion con Google.");
        return;
      }

      try {
        setError("");
        const session = await loginWithGoogle(credential);
        login(session);
        router.push(searchParams.get("redirect") ?? "/");
        router.refresh();
      } catch (authError) {
        setError(
          authError instanceof Error
            ? authError.message
            : "No se pudo iniciar sesion con Google.",
        );
      }
    };

    function renderGoogleButton() {
      if (cancelled || !window.google || !buttonRef.current) {
        return false;
      }

      if (initializedClientId !== googleClientId) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          ux_mode: "popup",
          callback: (response) => window.__terrifyGoogleCredentialHandler?.(response),
        });
        initializedClientId = googleClientId;
      }

      buttonRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(buttonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
        logo_alignment: "left",
        width: "340",
      });

      return true;
    }

    if (renderGoogleButton()) {
      return () => {
        cancelled = true;
      };
    }

    const retry = window.setInterval(() => {
      if (renderGoogleButton()) {
        window.clearInterval(retry);
      }
    }, 100);

    return () => {
      cancelled = true;
      window.clearInterval(retry);
    };
  }, [login, router, searchParams]);

  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    return null;
  }

  return (
    <div className="w-full space-y-3">
      <div ref={buttonRef} className="flex w-full justify-center" />
      {error ? (
        <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
