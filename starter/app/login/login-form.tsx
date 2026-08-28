"use client";

import { useActionState } from "react";
import { entrar } from "./actions";

export function LoginForm() {
  const [estado, formAction, pendiente] = useActionState(entrar, { error: null });

  return (
    <form action={formAction} className="glass-strong flex w-full max-w-sm flex-col gap-4 p-7">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Sinergéticos <span className="text-[var(--accent)]">Mailing</span>
        </h1>
        <p className="mt-1 text-sm text-[var(--text-2)]">Entra con tu correo del equipo.</p>
      </div>

      <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--text-2)]">
        Correo
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="input-glass"
          placeholder="tu@sinergeticos.com"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--text-2)]">
        Contraseña
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="input-glass"
          placeholder="••••••••"
        />
      </label>

      {estado.error ? (
        <p className="flow-error rounded-xl border border-[var(--danger)] bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
          {estado.error}
        </p>
      ) : null}

      <button type="submit" disabled={pendiente} className="btn-accent mt-1 w-full">
        {pendiente ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
