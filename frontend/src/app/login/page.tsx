"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const msg = sessionStorage.getItem("auth_message");
    if (!msg) return;
    sessionStorage.removeItem("auth_message");
    setTimeout(() => setError(msg), 0);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Terjadi kesalahan, coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center bg-gray-50 bg-cover bg-center px-4"
      style={{ backgroundImage: "url('/login-bg.webp')" }}
    >
      <div className="absolute inset-0 bg-black/55" />
      <div className="relative w-full max-w-sm rounded-xl border border-gray-200/70 bg-white shadow-lg p-8">
        <h1 className="text-xl font-semibold text-gray-900">BSI Plastik</h1>
        <p className="mt-1 text-sm text-gray-500">Masuk untuk melanjutkan</p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4"
        >
          {error && <Alert message={error} inline />}
          <div>
            <Label required>Username</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              required
              autoComplete="username"
            />
          </div>
          <div>
            <Label required>Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Memproses..." : "Masuk"}
          </Button>
        </form>
      </div>
    </div>
  );
}
