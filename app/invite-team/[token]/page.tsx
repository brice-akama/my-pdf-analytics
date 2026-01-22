"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle,
  Loader2,
  AlertCircle,
  Users,
  Mail,
  Shield,
  ArrowRight,
} from "lucide-react";
import Image from "next/image";

type InviteStatus = "loading" | "valid" | "invalid" | "expired" | "accepted";

export default function InviteAcceptPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [status, setStatus] = useState<InviteStatus>("loading");
  const [invitation, setInvitation] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [accepting, setAccepting] = useState(false);

  // Auth form for non-logged-in users
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    checkInviteAndAuth();
  }, [token]);

  const checkInviteAndAuth = async () => {
    try {
      // Check if user is logged in
      const authRes = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (authRes.ok) {
        const authData = await authRes.json();
        if (authData.success) {
          setIsAuthenticated(true);
          setCurrentUser(authData.user);
        }
      }

      // Validate invitation
      const inviteRes = await fetch("/api/invite-team/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const inviteData = await inviteRes.json();

      if (inviteRes.ok && inviteData.success) {
        setInvitation(inviteData.invitation);
        setEmail(inviteData.invitation.email); // Pre-fill email
        setStatus("valid");
      } else if (inviteRes.status === 410) {
        setStatus("expired");
      } else {
        setStatus("invalid");
      }
    } catch (error) {
      console.error("Check invite error:", error);
      setStatus("invalid");
    }
  };

  const handleAcceptInvite = async () => {
    if (!currentUser?.id) return;

    setAccepting(true);
    try {
      const res = await fetch("/api/invite-team/complete", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          userId: currentUser.id,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus("accepted");
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } else {
        alert(data.error || "Failed to accept invitation");
      }
    } catch (error) {
      console.error("Accept error:", error);
      alert("Failed to accept invitation");
    } finally {
      setAccepting(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    try {
      if (isSignup) {
        // Signup
        if (!firstName.trim() || !email.trim() || !password) {
          setAuthError("Please fill all required fields");
          return;
        }

        const res = await fetch("/api/auth/signup", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: firstName.trim(),
            lastName: lastName.trim() || undefined,
            email: email.trim(),
            password,
          }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          // Auto-accept invite after signup
          await fetch("/api/invite-team/complete", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token,
              userId: data.user.id,
            }),
          });

          setStatus("accepted");
          setTimeout(() => {
            router.push("/dashboard");
          }, 2000);
        } else {
          setAuthError(data.error || "Signup failed");
        }
      } else {
        // Login
        const res = await fetch("/api/auth/login", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          setIsAuthenticated(true);
          setCurrentUser(data.user);
          
          // Auto-accept invite after login
          await fetch("/api/invite-team/complete", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token,
              userId: data.user.id,
            }),
          });

          setStatus("accepted");
          setTimeout(() => {
            router.push("/dashboard");
          }, 2000);
        } else {
          setAuthError(data.error || "Login failed");
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      setAuthError("Network error. Please try again.");
    }
  };

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-12 pb-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-slate-600">Verifying invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid invitation
  if (status === "invalid") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-center text-2xl">
              Invalid Invitation
            </CardTitle>
            <CardDescription className="text-center text-base">
              This invitation link is not valid or has already been used.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-8">
            <Button
              onClick={() => router.push("/login")}
              className="bg-gradient-to-r from-purple-600 to-blue-600"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Expired invitation
  if (status === "expired") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
            <CardTitle className="text-center text-2xl">
              Invitation Expired
            </CardTitle>
            <CardDescription className="text-center text-base">
              This invitation has expired. Please contact the team owner to send
              a new invitation.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-8">
            <Button
              onClick={() => router.push("/login")}
              variant="outline"
              className="mr-2"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Successfully accepted
  if (status === "accepted") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-center text-2xl">
              Welcome to the Team! 🎉
            </CardTitle>
            <CardDescription className="text-center text-base">
              You've successfully joined the team. Redirecting to dashboard...
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Valid invitation - Show accept form
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center pb-8">
          {/* Logo */}
          <div className="h-16 w-16 mx-auto mb-4">
            <svg
              viewBox="0 0 200 200"
              xmlns="http://www.w3.org/2000/svg"
              className="h-full w-full"
            >
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: "#8B5CF6" }} />
                  <stop offset="100%" style={{ stopColor: "#3B82F6" }} />
                </linearGradient>
              </defs>
              <path
                d="M 60 50 L 60 150 L 140 150 L 140 70 L 120 50 Z"
                fill="url(#logoGrad)"
              />
              <rect x="75" y="100" width="12" height="30" fill="white" opacity="0.9" rx="2" />
              <rect x="94" y="85" width="12" height="45" fill="white" opacity="0.9" rx="2" />
              <rect x="113" y="70" width="12" height="60" fill="white" opacity="0.9" rx="2" />
            </svg>
          </div>

          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            You're Invited!
          </CardTitle>
          <CardDescription className="text-base">
            {invitation?.inviterName} has invited you to join their team on DocMetrics
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Invitation Details */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-purple-600 flex items-center justify-center">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Invited Email</p>
                <p className="font-semibold text-slate-900">{invitation?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Role</p>
                <p className="font-semibold text-slate-900 capitalize">
                  {invitation?.role}
                </p>
              </div>
            </div>
          </div>

          {/* If already authenticated */}
          {isAuthenticated && currentUser ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-900">
                      Signed in as {currentUser.email}
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      Click below to accept the invitation
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleAcceptInvite}
                disabled={accepting}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {accepting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  <>
                    Accept Invitation
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-slate-500">
                Not you?{" "}
                <button
                  onClick={() => {
                    document.cookie = "token=; path=/; max-age=0";
                    document.cookie = "auth-token=; path=/; max-age=0";
                    router.push(`/invite-team/${token}`);
                  }}
                  className="text-purple-600 hover:underline font-medium"
                >
                  Sign in with a different account
                </button>
              </p>
            </div>
          ) : (
            /* Auth Form */
            <form onSubmit={handleAuth} className="space-y-4">
              {authError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{authError}</p>
                </div>
              )}

              {isSignup && (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Name *</Label>
                      <Input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name</Label>
                      <Input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={!!invitation?.email}
                />
              </div>

              <div className="space-y-2">
                <Label>Password *</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isSignup ? "Create Account & Join Team" : "Sign In & Join Team"}
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>

              <p className="text-center text-sm text-slate-600">
                {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignup(!isSignup);
                    setAuthError("");
                  }}
                  className="text-purple-600 hover:underline font-medium"
                >
                  {isSignup ? "Sign in" : "Sign up"}
                </button>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}