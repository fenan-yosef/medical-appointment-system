"use client";
import React, { useState, useContext } from "react";
import { ThemeContext } from "../../components/theme-provider";

function IconUser() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4" stroke="#888" strokeWidth="2" />
      <path
        d="M4 20c0-2.2 3.6-4 8-4s8 1.8 8 4"
        stroke="#888"
        strokeWidth="2"
      />
    </svg>
  );
}
function IconLock() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
      <rect
        x="5"
        y="11"
        width="14"
        height="8"
        rx="2"
        stroke="#888"
        strokeWidth="2"
      />
      <path d="M8 11V7a4 4 0 1 1 8 0v4" stroke="#888" strokeWidth="2" />
    </svg>
  );
}
function IconTheme({ theme }: { theme: string }) {
  return theme === "dark" ? (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
      <path
        d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 1 0 9.79 9.79z"
        stroke="#888"
        strokeWidth="2"
      />
    </svg>
  ) : (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="5" stroke="#888" strokeWidth="2" />
      <path
        d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        stroke="#888"
        strokeWidth="2"
      />
    </svg>
  );
}

export default function AuthPage() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const { theme, setTheme } = useContext(ThemeContext);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const endpoint = tab === "login" ? "/api/auth/login" : "/api/auth/register";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setMsg(data.message);
    } else {
      setMsg(data.message || "Error");
    }
  }

  return (
    <div
      className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${theme === "dark" ? "bg-[#23272e]" : "bg-[#c7d2cc]"
        }`}
    >
      <div
        className={`bg-white dark:bg-[#23272e] rounded border border-gray-200 dark:border-gray-700 shadow-lg w-[350px]`}
      >
        <div className="bg-gray-800 dark:bg-gray-900 text-white px-6 py-3 rounded-t flex justify-between items-center">
          <span className="font-semibold">
            {tab === "login"
              ? "login to administration"
              : "register new account"}
          </span>
          <div className="flex gap-2 items-center">
            <button
              className={`text-xs px-2 py-1 rounded ${tab === "login" ? "bg-gray-700" : ""
                }`}
              onClick={() => setTab("login")}
            >
              Login
            </button>
            <button
              className={`text-xs px-2 py-1 rounded ${tab === "register" ? "bg-gray-700" : ""
                }`}
              onClick={() => setTab("register")}
            >
              Register
            </button>
            <button
              aria-label="Toggle theme"
              className="ml-2 p-1 rounded hover:bg-gray-700 dark:hover:bg-gray-800 transition"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              type="button"
            >
              <IconTheme theme={theme} />
            </button>
          </div>
        </div>
        <form
          className="px-6 py-6 flex flex-col gap-4"
          onSubmit={handleSubmit}
        >
          <div className="flex items-center border rounded px-2 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
            <span className="mr-2">
              <IconUser />
            </span>
            <input
              type="text"
              placeholder="username"
              className="w-full bg-transparent outline-none py-2 text-black dark:text-white"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div className="flex items-center border rounded px-2 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
            <span className="mr-2">
              <IconLock />
            </span>
            <input
              type="password"
              placeholder="password"
              className="w-full bg-transparent outline-none py-2 text-black dark:text-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={
                tab === "login" ? "current-password" : "new-password"
              }
            />
          </div>
          <div className="flex justify-between items-center text-xs">
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="accent-gray-700"
              />
              remember me
            </label>
            <a href="#" className="text-gray-500 hover:underline">
              forgot details?
            </a>
          </div>
          <button
            type="submit"
            className="bg-gray-800 dark:bg-gray-900 text-white py-2 rounded font-semibold hover:bg-gray-700 dark:hover:bg-gray-700 transition"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : tab === "login"
                ? "sign in"
                : "register"}
          </button>
          {msg && (
            <div className="text-center text-sm text-gray-700 dark:text-gray-300">
              {msg}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
