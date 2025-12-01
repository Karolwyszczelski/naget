"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../../untils/supabase/client";

export default function AdminLoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);

    try {
      // 1) logowanie przez Supabase Auth (email + hasło)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError("Nieprawidłowy e-mail lub hasło.");
        setPending(false);
        return;
      }

      // 2) sprawdzenie, czy to użytkownik z tabeli admin_users
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Problem z sesją logowania. Spróbuj ponownie.");
        setPending(false);
        return;
      }

      const { data: admins, error: adminError } = await supabase
        .from("admin_users")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      if (adminError || !admins || admins.length === 0) {
        setError("To konto nie ma uprawnień administratora.");
        // wyloguj, żeby nie zostawiać sesji
        await supabase.auth.signOut();
        setPending(false);
        return;
      }

      // 3) OK – przekierowanie do panelu
      router.push("/admin/orders");
    } catch {
      setError("Wystąpił błąd podczas logowania.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100">
      <div className="w-full max-w-md rounded-3xl border border-border bg-white/90 shadow-soft p-6 md:p-8">
        <p className="text-[11px] uppercase tracking-[0.24em] text-neutral-500">
          Panel administracyjny
        </p>
        <h1 className="mt-1 text-[22px] md:text-[26px] font-extrabold text-accent uppercase">
          Logowanie admina
        </h1>
        <p className="mt-2 text-[13px] text-neutral-700">
          Dostęp tylko dla administratora sklepu Naget.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1">
            <label className="text-[12px] font-semibold text-neutral-700">
              E-mail
            </label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-border bg-white/80 px-3 py-2 text-[14px] outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[12px] font-semibold text-neutral-700">
              Hasło
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-border bg-white/80 px-3 py-2 text-[14px] outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              required
            />
          </div>

          {error && (
            <p className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded-2xl px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full mt-2 rounded-2xl bg-accent text-white text-[12px] font-semibold uppercase tracking-[0.18em] py-2.5 hover:bg-accent/90 disabled:opacity-60"
          >
            {pending ? "Logowanie..." : "Zaloguj się"}
          </button>
        </form>
      </div>
    </div>
  );
}
