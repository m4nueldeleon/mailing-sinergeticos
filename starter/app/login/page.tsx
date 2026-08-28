import { redirect } from "next/navigation";
import { getUsuario } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const usuario = await getUsuario();
  if (usuario) redirect("/");

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <LoginForm />
    </div>
  );
}
