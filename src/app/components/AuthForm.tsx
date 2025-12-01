// src/components/AuthForm.tsx
"use client";

import { useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignUp = async () => {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
    });
    if (error) {
      console.error(error);
      alert(error.message);
    } else {
      alert("Sprawdź skrzynkę mailową, aby potwierdzić konto.");
    }
  };

  const handleSignIn = async () => {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error(error);
      alert(error.message);
    } else {
      // możesz np. przeładować stronę lub przekierować
      window.location.reload();
    }
  };

  return (
    <div className="space-y-3">
      <input
        type="email"
        placeholder="E-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-2xl border border-border px-3 py-2 text-[13px]"
      />
      <input
        type="password"
        placeholder="Hasło"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-2xl border border-border px-3 py-2 text-[13px]"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSignIn}
          className="btn btn-sm flex-1"
        >
          Zaloguj
        </button>
        <button
          type="button"
          onClick={handleSignUp}
          className="btn btn-sm flex-1 bg-white text-accent border border-accent"
        >
          Załóż konto
        </button>
      </div>
    </div>
  );
}
