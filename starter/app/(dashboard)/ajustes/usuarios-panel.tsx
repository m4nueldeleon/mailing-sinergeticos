"use client";

import { useActionState } from "react";
import { invitarUsuario, cambiarRol, type UsuarioApp, type EstadoAjustes } from "./actions";

const ESTADO_INICIAL: EstadoAjustes = { ok: false, error: null };

export function UsuariosPanel({ usuarios, miId }: { usuarios: UsuarioApp[]; miId: string }) {
  const [estadoInvitar, invitarAction, invitando] = useActionState(invitarUsuario, ESTADO_INICIAL);

  return (
    <section className="glass rise space-y-5 p-6">
      <div>
        <h2 className="font-display text-lg font-semibold">Usuarios</h2>
        <p className="text-sm text-[var(--text-2)]">Quién entra al panel y con qué rol.</p>
      </div>

      <table className="table-glass">
        <thead>
          <tr>
            <th>Correo</th>
            <th>Rol</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <FilaUsuario key={u.id} usuario={u} soyYo={u.id === miId} />
          ))}
          {usuarios.length === 0 ? (
            <tr>
              <td colSpan={3} className="text-center text-[var(--text-3)]">
                Sin usuarios todavía.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <form action={invitarAction} className="flex flex-wrap items-end gap-3 border-t border-[var(--border)] pt-4">
        <label className="flex flex-1 min-w-[220px] flex-col gap-1.5 text-sm font-medium text-[var(--text-2)]">
          Invitar por correo
          <input name="email" type="email" required className="input-glass" placeholder="nombre@sinergeticos.com" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--text-2)]">
          Rol
          <select name="role" defaultValue="editor" className="input-glass">
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <button type="submit" disabled={invitando} className="btn-accent">
          {invitando ? "Invitando…" : "Invitar"}
        </button>
      </form>
      {estadoInvitar.error ? <p className="text-sm text-[var(--danger)]">{estadoInvitar.error}</p> : null}
      {estadoInvitar.ok ? <p className="text-sm text-[var(--success)]">Invitación enviada.</p> : null}
    </section>
  );
}

function FilaUsuario({ usuario, soyYo }: { usuario: UsuarioApp; soyYo: boolean }) {
  const [estado, action, pendiente] = useActionState(cambiarRol, ESTADO_INICIAL);

  return (
    <tr>
      <td>
        {usuario.email} {soyYo ? <span className="chip ml-1">tú</span> : null}
      </td>
      <td className="capitalize">{usuario.role}</td>
      <td>
        <form action={action} className="flex items-center gap-2">
          <input type="hidden" name="userId" value={usuario.id} />
          <select name="role" defaultValue={usuario.role} className="input-glass !py-1 !text-xs">
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" disabled={pendiente} className="btn-ghost !py-1 !text-xs">
            {pendiente ? "…" : "Guardar"}
          </button>
          {estado.error ? <span className="text-xs text-[var(--danger)]">{estado.error}</span> : null}
        </form>
      </td>
    </tr>
  );
}
