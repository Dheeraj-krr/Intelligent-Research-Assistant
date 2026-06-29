import React, { useState } from 'react';
import { Mail, Lock, User, ShieldAlert, Award, ArrowRight, ShieldCheck, Terminal } from 'lucide-react';
import { motion } from 'motion/react';
import axios from 'axios';

interface RegisterScreenProps {
  onRegisterSuccess: (name: string, email: string) => void;
  onNavigateToLogin: () => void;
}

export default function RegisterScreen({ onRegisterSuccess, onNavigateToLogin }: RegisterScreenProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);

    if (password !== confirmPassword) {
      setErrorText('Passwords do not match. Verify confirm password field.');
      return;
    }

    setIsLoading(true);

    // Simulate database write
    setTimeout(() => {
      setSuccess(true);
      setIsLoading(false);
      setTimeout(() => {
        onRegisterSuccess(name, email);
      }, 1000);
    }, 1800);
  };



  return (
    <div className="relative min-h-screen bg-brand-bg text-brand-primary flex flex-col justify-center items-center p-4">
      {/* Background radial effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] rounded-full bg-brand-primary-container/5 blur-[120px] animate-pulse"></div>
        <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-brand-tertiary-container/5 blur-[120px]" style={{ animationDelay: '1s' }}></div>
      </div>

      <main className="relative z-10 w-full max-w-md">
        <header className="text-center mb-6">
          <h1 className="font-geist text-3xl font-bold text-brand-primary mb-1 tracking-tight">Research Assistant</h1>
          <p className="text-sm text-brand-on-secondary-container opacity-80">Create your researcher profile</p>
        </header>

        {/* Auth form card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="glass-panel p-6 md:p-8 rounded-2xl shadow-2xl bg-brand-surface/80 border border-brand-border relative overflow-hidden"
        >
          {isLoading && (
            <div className="absolute top-0 left-0 w-full h-1 bg-brand-surface-highest">
              <div className="h-full bg-brand-tertiary animate-pulse shadow-[0_0_10px_#00759f]" style={{ width: '100%' }}></div>
            </div>
          )}

          {/* Feedback section */}
          {errorText && (
            <div className="mb-4 p-3 rounded-lg border border-brand-error/20 bg-brand-error-container/20 text-brand-error text-xs leading-relaxed">
              <span>{errorText}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs">
              <span>Success! Redirecting to research station...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Fullname input */}
            <div className="space-y-1.5">
              <label className="text-xs font-geist font-semibold text-brand-on-secondary-container block" htmlFor="fullname">
                Full Name
              </label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-brand-outline" />
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  disabled={isLoading}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name"
                  className="w-full bg-brand-surface-lowest border border-brand-border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>
            </div>

            {/* Email field */}
            <div className="space-y-1.5">
              <label className="text-xs font-geist font-semibold text-brand-on-secondary-container block" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-brand-outline" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  disabled={isLoading}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full bg-brand-surface-lowest border border-brand-border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <label className="text-xs font-geist font-semibold text-brand-on-secondary-container block" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-brand-outline" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  disabled={isLoading}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-brand-surface-lowest border border-brand-border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <label className="text-xs font-geist font-semibold text-brand-on-secondary-container block" htmlFor="confirm-password">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-brand-outline" />
                <input
                  id="confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  disabled={isLoading}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm Password"
                  className="w-full bg-brand-surface-lowest border border-brand-border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>
            </div>

            {/* Register submit */}
            <button
              id="submit-btn"
              type="submit"
              disabled={isLoading || success}
              className="w-full bg-brand-primary-container hover:brightness-110 text-white font-geist text-sm py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
              onClick={async () => {
                console.log("Button was clicked");

                try {
                  const response = await fetch("http://127.0.0.1:8000/register", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                      name: name,
                      email: email,
                      password: password
                    }),
                  });

                  console.log("API called");

                  const data = await response.json();

                  console.log(data);

                  if (response.ok) {
                    alert("Registration Successful")
                    onNavigateToLogin();
                  } else {
                    alert("Registration Failed: " + (data.error || "Unknown error"));
                  }
                } catch (error) {
                  console.error("Error occurred while registering:", error);
                }
              }}>


              <>
                <span>Register Profile</span>
                <ArrowRight className="w-4 h-4" />
              </>

            </button>
          </form>

          {/* Bottom link to toggle */}
          <footer className="mt-6 text-center text-xs text-brand-on-secondary-container">
            Already have an active workspace account?{' '}
            <button
              onClick={onNavigateToLogin}
              className="text-brand-primary font-bold hover:underline ml-1"
            >
              Login instead
            </button>
          </footer>


        </motion.div>
      </main>

      <footer className="mt-8 p-4 text-center opacity-40 text-xs">
        © 2026 Research Assistant Platform. Technical Futurism Aesthetic.
        <br />
        Developed by Dheeraj Kumar. All rights reserved.
      </footer>
    </div>
  );
}
