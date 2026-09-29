"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useAuth } from "@/components/auth-provider";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { loginUser, registerUser } from "@/lib/api";

type Mode = "login" | "register";

type Status = {
  type: "idle" | "loading" | "error" | "success";
  message: string;
};

function validateEmail(email: string): string | null {
  if (!email) return "El correo es obligatorio.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Ingresa un correo valido.";
  }
  return null;
}

function validatePassword(password: string, mode: Mode): string | null {
  if (!password) return "La contrasena es obligatoria.";
  if (mode === "register" && password.length < 8) {
    return "La contrasena debe tener al menos 8 caracteres.";
  }
  return null;
}

function validateFullName(name: string): string | null {
  if (!name || name.trim().length < 2) {
    return "Ingresa tu nombre completo.";
  }
  return null;
}

export function AuthForm({ defaultMode = "login" }: { defaultMode?: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verified = searchParams.get("verified");
  const { login } = useAuth();
  const redirectTo = searchParams.get("redirect") ?? "/";

  const [mode, setMode] = useState<Mode>(defaultMode);
  const [form, setForm] = useState({ email: "", password: "", fullName: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>({ type: "idle", message: "" });

  function updateField(field: "email" | "password" | "fullName", value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function validateForm() {
    const nextErrors: Record<string, string> = {};

    const emailError = validateEmail(form.email.trim());
    if (emailError) nextErrors.email = emailError;

    const passwordError = validatePassword(form.password, mode);
    if (passwordError) nextErrors.password = passwordError;

    if (mode === "register") {
      const fullNameError = validateFullName(form.fullName);
      if (fullNameError) nextErrors.fullName = fullNameError;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setStatus({ type: "loading", message: "" });

    try {
      if (mode === "register") {
        const result = await registerUser({
          email: form.email.trim().toLowerCase(),
          password: form.password,
          fullName: form.fullName.trim(),
        });
        router.push(
          `/registro-exitoso?email=${encodeURIComponent(result.email)}`,
        );
        return;
      }

      const session = await loginUser({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      login(session);
      router.push(redirectTo);
      router.refresh();
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Algo salio mal. Intenta de nuevo.",
      });
    }
  }

  function handleModeChange(nextMode: Mode) {
    setMode(nextMode);
    setErrors({});
    setStatus({ type: "idle", message: "" });
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-[-0.03em] text-ink">
          {mode === "login" ? "Bienvenido de vuelta" : "Crea tu cuenta"}
        </h2>
        <p className="mt-1.5 text-sm text-stone">
          {mode === "login"
            ? "Ingresa tus datos para continuar."
            : "Es gratis y toma menos de un minuto."}
        </p>
      </div>

      {verified === "true" ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Email verificado. Ya puedes iniciar sesion.
        </div>
      ) : null}

      <GoogleAuthButton />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-line" />
        <span className="text-xs font-medium text-stone">
          o continua con email
        </span>
        <div className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {mode === "register" ? (
          <div>
            <label
              htmlFor="fullName"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-stone"
            >
              Nombre completo
            </label>
            <input
              id="fullName"
              type="text"
              value={form.fullName}
              onChange={(event) => updateField("fullName", event.target.value)}
              placeholder="Tu nombre"
              autoComplete="name"
              aria-invalid={Boolean(errors.fullName)}
              aria-describedby={errors.fullName ? "fullName-error" : undefined}
              className={`w-full rounded-2xl border bg-sand px-4 py-3.5 text-sm font-medium text-ink placeholder:text-stone/40 outline-none transition focus:bg-white focus:shadow-[0_0_0_3px_rgba(209,154,61,0.08)] ${
                errors.fullName
                  ? "border-red-400 focus:border-red-400"
                  : "border-line focus:border-cta/50"
              }`}
            />
            {errors.fullName ? (
              <p id="fullName-error" className="mt-1 text-xs text-red-500">
                {errors.fullName}
              </p>
            ) : null}
          </div>
        ) : null}

        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-stone"
          >
            Correo electronico
          </label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            placeholder="tu@correo.com"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
              className={`w-full rounded-2xl border bg-sand px-4 py-3.5 text-sm font-medium text-ink placeholder:text-stone/40 outline-none transition focus:bg-white focus:shadow-[0_0_0_3px_rgba(209,154,61,0.08)] ${
                errors.email
                  ? "border-red-400 focus:border-red-400"
                  : "border-line focus:border-cta/50"
              }`}
          />
          {errors.email ? (
            <p id="email-error" className="mt-1 text-xs text-red-500">
              {errors.email}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-stone"
          >
            Contrasena
          </label>
          <input
            id="password"
            type="password"
            value={form.password}
            onChange={(event) => updateField("password", event.target.value)}
            placeholder={
              mode === "register" ? "Minimo 8 caracteres" : "••••••••"
            }
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
              className={`w-full rounded-2xl border bg-sand px-4 py-3.5 text-sm font-medium text-ink placeholder:text-stone/40 outline-none transition focus:bg-white focus:shadow-[0_0_0_3px_rgba(209,154,61,0.08)] ${
                errors.password
                  ? "border-red-400 focus:border-red-400"
                  : "border-line focus:border-cta/50"
              }`}
          />
          {errors.password ? (
            <p id="password-error" className="mt-1 text-xs text-red-500">
              {errors.password}
            </p>
          ) : null}
        </div>

        {status.type === "error" ? (
          <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            {status.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={status.type === "loading"}
          className="w-full rounded-2xl bg-cta py-4 text-sm font-bold text-text shadow-[0_4px_14px_rgba(209,154,61,0.3)] transition hover:-translate-y-px hover:bg-cta-dark hover:shadow-[0_6px_20px_rgba(209,154,61,0.4)] active:scale-[0.98] disabled:opacity-40 disabled:hover:translate-y-0"
        >
          {status.type === "loading"
            ? "Un momento..."
            : mode === "login"
              ? "Iniciar sesion"
              : "Crear cuenta gratis"}
        </button>
      </form>

      <p className="text-center text-sm text-stone">
        {mode === "login" ? (
          <>
            ¿Sin cuenta aun?{" "}
            <button
              type="button"
              onClick={() => handleModeChange("register")}
              className="font-semibold text-cta hover:underline"
            >
              Crear cuenta gratis
            </button>
          </>
        ) : (
          <>
            ¿Ya tienes cuenta?{" "}
            <button
              type="button"
              onClick={() => handleModeChange("login")}
              className="font-semibold text-cta hover:underline"
            >
              Iniciar sesion
            </button>
          </>
        )}
      </p>

      <p className="text-center text-xs text-stone/60">
        <Link href="/" className="transition hover:text-cta">
          Volver al inicio sin registrarse
        </Link>
      </p>
    </div>
  );
}
