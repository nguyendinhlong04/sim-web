"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <section className="mx-auto max-w-md space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-gray-900">Admin Login</h1>
      <form
        className="grid gap-4"
        onSubmit={async (event) => {
          event.preventDefault();
          await signIn("credentials", {
            email,
            password,
            callbackUrl: "/admin",
          });
        }}
      >
        <input
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <input
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <button
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          type="submit"
        >
          Sign in
        </button>
      </form>
    </section>
  );
}
