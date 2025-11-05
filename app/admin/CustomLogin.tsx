"use client";

import React, { useState } from "react";
import { useLogin, useNotify } from "react-admin";
import toast from "react-hot-toast";

const CustomLogin: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const login = useLogin();
  const notify = useNotify();

  // Login form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password });
      toast.success("Login successful!");
    } catch (error) {
      notify("Invalid email or password", { type: "error" });
      toast.error("Invalid email or password");
    }
  };

  // Forgot password submit
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      notify("Please enter your email", { type: "warning" });
      return;
    }

    try {
      const res = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("Password reset email sent. Check your inbox.");
        setForgotPasswordMode(false);
        setResetEmail("");
      } else {
        notify(data.error || "Failed to send reset email", { type: "error" });
        toast.error(data.error || "Failed to send reset email");
      }
    } catch (err) {
      notify("Internal error", { type: "error" });
      toast.error("Internal error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center mt-12">
      {!forgotPasswordMode ? (
        <form onSubmit={handleSubmit} className="w-96 p-6 bg-white rounded shadow">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-blue-600">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded text-blue-600"
              placeholder="Enter email"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-blue-600">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded text-blue-600"
              placeholder="Enter password"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700"
          >
            Login
          </button>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setForgotPasswordMode(true)}
              className="text-sm text-blue-600 hover:underline"
            >
              Forgot Password?
            </button>
          </div>
        </form>
      ) : (
        <form
          onSubmit={handleForgotPassword}
          className="w-96 p-6 bg-white rounded shadow"
        >
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Enter your admin email to reset password
            </label>
            <input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="w-full p-3 border rounded"
              placeholder="Enter email"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-green-500 text-white py-3 rounded hover:bg-green-600"
          >
            Send Reset Email
          </button>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setForgotPasswordMode(false)}
              className="text-sm text-blue-600 hover:underline"
            >
              Back to Login
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CustomLogin;