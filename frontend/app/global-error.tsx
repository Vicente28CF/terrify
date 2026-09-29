"use client";

import Link from "next/link";

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("Error global capturado:", error);

  return (
    <html lang="es">
      <body>
        <main
          style={{
            display: "flex",
            minHeight: "100vh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#F3EEE4",
            padding: "0 16px",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "400px",
              borderRadius: "24px",
              border: "1px solid rgba(0,0,0,0.08)",
              backgroundColor: "#ffffff",
              padding: "40px",
              textAlign: "center",
              boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
            }}
          >
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#111214", margin: 0 }}>
              Error crítico
            </h1>
            <p style={{ marginTop: "12px", fontSize: "14px", color: "#6b6b68", lineHeight: 1.6 }}>
              La aplicación falló al cargar. Intenta recargar la página.
            </p>

            <div style={{ marginTop: "32px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <button
                type="button"
                onClick={reset}
                style={{
                  width: "100%",
                  borderRadius: "16px",
                  backgroundColor: "#D19A3D",
                  color: "#2B241E",
                  padding: "14px 0",
                  fontSize: "14px",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Reintentar
              </button>
              <Link
                href="/"
                style={{
                  width: "100%",
                  borderRadius: "16px",
                  border: "1px solid rgba(0,0,0,0.1)",
                  padding: "14px 0",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#111214",
                  textDecoration: "none",
                  textAlign: "center" as const,
                }}
              >
                Volver al inicio
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
