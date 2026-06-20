import React, { useState } from 'react';
import { Mail, Lock, Server, Sparkles, LogIn, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginScreenProps {
  onLoginSuccess: (email: string) => void;
  onNavigateToRegister: () => void;
}

export default function LoginScreen({ onLoginSuccess, onNavigateToRegister }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    setIsLoading(true);

    setFeedback(null);

    try {

      const response = await fetch(
        "http://127.0.0.1:8000/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            email,
            password
          })
        }
      );

      const data: any = await response.json();

      console.log(data);

      if (data.access_token) {

        localStorage.setItem(
          "token",
          data.access_token
        );

        setFeedback({
          type: "success",
          message: "Login Successful"
        });

        onLoginSuccess(email);

      } else {

        setFeedback({
          type: "error",
          message: "Invalid Email or Password"
        });

      }

    } catch (error) {

      console.log(error);

      setFeedback({
        type: "error",
        message: "Server Error"
      });

    }

    setIsLoading(false);

  };

  return (
    <div className="relative min-h-screen bg-brand-bg text-brand-primary flex flex-col justify-center items-center p-4">
      {/* Decorative Atmospheric Glow Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] rounded-full bg-brand-primary-container/5 blur-[120px] animate-pulse"></div>
        <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-brand-tertiary-container/5 blur-[120px]" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <main className="relative z-10 w-full max-w-md">
        {/* Header Branding */}
        <header className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center gap-2 mb-3"
          >
            <Sparkles className="w-8 h-8 text-brand-primary animate-pulse" />
            <h1 className="font-geist text-3xl font-bold text-brand-primary tracking-tight">Research Assistant</h1>
          </motion.div>
          <p className="text-sm text-brand-on-secondary-container opacity-80">Access your high-focus research environment</p>
        </header>

        {/* Form Card wrapper */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-panel p-8 rounded-2xl shadow-2xl bg-brand-surface/80 border border-brand-border"
        >
          {/* Feedback Container */}
          {feedback && (
            <div
              className={`mb-6 p-4 rounded-xl border flex items-center gap-3 text-xs leading-relaxed ${feedback.type === 'error'
                ? 'bg-brand-error-container/20 border-brand-error/30 text-brand-error'
                : 'bg-brand-tertiary-container/20 border-brand-tertiary/30 text-brand-tertiary'
                }`}
            >
              <span className="font-semibold">{feedback.message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-xs font-geist font-bold text-brand-on-secondary-container block px-1" htmlFor="email">
                Email Address
              </label>
              <div className="relative group/input">
                <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-brand-outline transition-colors group-focus-within/input:text-brand-primary" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  disabled={isLoading}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full bg-brand-surface-lowest border border-brand-border hover:border-brand-primary/50 text-brand-text-primary rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary transition-all text-sm font-sans"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-geist font-bold text-brand-on-secondary-container" htmlFor="password">
                  Password
                </label>
                <a href="#forgot" className="text-xs font-geist text-brand-primary hover:underline transition-all">
                  Forgot?
                </a>
              </div>
              <div className="relative group/input">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-brand-outline transition-colors group-focus-within/input:text-brand-primary" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  disabled={isLoading}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-brand-surface-lowest border border-brand-border hover:border-brand-primary/50 text-brand-text-primary rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary transition-all text-sm font-sans"
                />
              </div>
            </div>

            {/* Action Button */}
            <button
              id="submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-primary-container hover:brightness-110 text-white py-3 rounded-xl font-geist font-semibold flex items-center justify-center gap-2 shadow-lg transition-all duration-200 active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={async () => {
                console.log(email);
                console.log(password);

                try {




                  const response = await fetch("http://127.0.0.1:8000/login",
                    {
                      method: "POST",

                      headers: {
                        "Content-Type": "application/json",
                      },

                      body: JSON.stringify({
                        email: email,
                        password: password
                      }),
                    }
                  );

                  console.log(response);

                  const data = await response.json();

                  console.log(data);


                  localStorage.setItem("token", data.access_token);




                } catch (error) {
                  console.log(error);
                }

              }}


            >
              {isLoading ? (
                <>
                  <span>Verifying Node...</span>
                  <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
                </>
              ) : (
                <>
                  <span>Login to your Profile</span>
                  <LogIn className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch Link */}
          <footer className="mt-8 text-center text-xs text-brand-on-secondary-container">
            Don't have an credentials profile yet?{' '}
            <button
              onClick={onNavigateToRegister}
              className="text-brand-primary font-bold hover:underline ml-1"
            >
              Register here
            </button>
          </footer>
        </motion.div>


      </main>
    </div >
  );
}
