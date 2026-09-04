"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { guardarPasswordNueva, type EstadoPassword } from "./actions";

const ESTADO_INICIAL: EstadoPassword = { error: null };
const MIN_LARGO = 10;

/** La sesión del enlace de invitación/recuperación viaja en el # de la URL
 * (formato implicit) — nunca llega al servidor. Se lee e instala a mano. */
function sesionDelEnlace(): { access_token: string; refresh_token: string } | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return null;
  const p = new URLSearchParams(hash);
  const access_token = p.get("access_token");
  const refresh_token = p.get("refresh_token");
  return access_token && refresh_token ? { access_token, refresh_token } : null;
}

function errorDelEnlace(): string | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return null;
  const p = new URLSearchParams(hash);
  if (!p.get("error_code") && !p.get("error")) return null;
  return "Este enlace ya venció o ya se usó. Pide que te manden uno nuevo desde Ajustes → Usuarios.";
}

type Estado = "verificando" | "listo" | "sin-sesion";

function Formulario() {
  const [estado, disparar, guardando] = useActionState(guardarPasswordNueva, ESTADO_INICIAL);
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const noCoincide = confirmar.length > 0 && password !== confirmar;

  return (
    <form action={disparar} className="flex flex-col gap-4">
      {estado.error && <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{estado.error}</p>}
      <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--text-2)]">
        Contraseña nueva (mínimo {MIN_LARGO} caracteres)
        <input name="password" type="password" required minLength={MIN_LARGO} value={password} onChange={(e) => setPassword(e.target.value)} className="input-glass" autoComplete="new-password" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--text-2)]">
        Repítela
        <input name="confirmar" type="password" required value={confirmar} onChange={(e) => setConfirmar(e.target.value)} className="input-glass" autoComplete="new-password" />
      </label>
      {noCoincide && <p className="text-sm text-red-600">Las contraseñas no coinciden.</p>}
      <button type="submit" disabled={guardando || password.length < MIN_LARGO || noCoincide} className="btn-accent">
        {guardando ? "Guardando…" : "Guardar y entrar"}
      </button>
    </form>
  );
}

export default function ActualizarPasswordPage() {
  const [estado, setEstado] = useState<Estado>("verificando");
  const [errorEnlace, setErrorEnlace] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    const fallo = errorDelEnlace();
    if (fallo) {
      setErrorEnlace(fallo);
      setEstado("sin-sesion");
      return;
    }

    const supabase = createSupabaseBrowser();
    const listo = () => {
      if (!cancelado) setEstado("listo");
    };

    const delEnlace = sesionDelEnlace();
    if (delEnlace) {
      supabase.auth.setSession(delEnlace).then(({ data, error }) => {
        if (cancelado) return;
        if (error || !data.session) {
          setErrorEnlace("Este enlace ya venció. Pide que te manden uno nuevo.");
          setEstado("sin-sesion");
          return;
        }
        window.history.replaceState(null, "", window.location.pathname);
        listo();
      });
      return () => {
        cancelado = true;
      };
    }

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) listo();
    });
    const timer = setTimeout(() => {
      if (!cancelado) setEstado((prev) => (prev === "verificando" ? "sin-sesion" : prev));
    }, 5000);
    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <div className="glass rise w-full max-w-sm p-7">
        <h1 className="font-display text-2xl font-bold tracking-tight">Crea tu contraseña</h1>
        <p className="mt-1 text-sm text-[var(--text-2)]">Es tu primera vez entrando — necesitas ponerle una contraseña a tu cuenta.</p>

        <div className="mt-5">
          {estado === "verificando" && <p className="text-sm text-[var(--text-2)]">Verificando tu acceso…</p>}
          {estado === "sin-sesion" && (
            <div className="flex flex-col gap-3">
              <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{errorEnlace ?? "Tu enlace expiró o tu sesión terminó."}</p>
              <Link href="/login" className="btn-ghost text-center">
                Ir a iniciar sesión
              </Link>
            </div>
          )}
          {estado === "listo" && <Formulario />}
        </div>
      </div>
    </div>
  );
}
