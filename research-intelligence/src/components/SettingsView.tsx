import React, { useEffect, useState } from 'react';
import { AppSettings } from '../types';
import { Key, Eye, Shield, Save, CheckCircle, LogOut } from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onLogout: () => void;
}

export default function SettingsView({ settings, onSaveSettings, onLogout }: SettingsViewProps) {
  const [accountName, setAccountName] = useState(settings.accountName);
  const [email, setEmail] = useState(settings.email);
  const [darkMode, setDarkMode] = useState(settings.darkMode);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    setAccountName(settings.accountName);
    setEmail(settings.email);
    setDarkMode(settings.darkMode);
  }, [settings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      accountName,
      email,
      darkMode
    });

    setShowNotification(true);
    window.setTimeout(() => {
      setShowNotification(false);
    }, 2500);
  };

  return (
    <div className="space-y-8 animate-fade-in relative z-10 max-w-4xl mx-auto">
      <div>
        <h2 className="font-geist text-3xl font-bold text-brand-text-primary tracking-tight">Account Settings</h2>
        <p className="text-sm text-brand-on-secondary-container mt-1">
          Manage your account details, dark mode preference, and session security.
        </p>
      </div>

      {showNotification && (
        <div className="p-4 rounded-xl bg-brand-primary-container/20 border border-brand-primary/40 text-brand-primary text-xs flex items-center gap-2.5 shadow-md">
          <CheckCircle className="w-5 h-5 text-brand-primary" />
          <span className="font-geist font-semibold">Settings saved successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="glass-panel p-6 rounded-3xl bg-brand-surface/60 space-y-6">
          <h3 className="font-geist text-sm font-bold text-brand-primary uppercase tracking-wider flex items-center gap-2">
            <Key className="w-4 h-4" />
            Account
          </h3>

          <div className="grid gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-geist font-bold text-brand-on-secondary-container" htmlFor="accountName">
                Name
              </label>
              <input
                id="accountName"
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="w-full bg-brand-surface-lowest border border-brand-border rounded-xl py-2.5 px-4 text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary text-brand-text-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-geist font-bold text-brand-on-secondary-container" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                // onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-brand-surface-lowest border border-brand-border rounded-xl py-2.5 px-4 text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary text-brand-text-primary"
              />
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl bg-brand-surface/60 space-y-6">
          <h3 className="font-geist text-sm font-bold text-brand-primary uppercase tracking-wider flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Preferences
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-brand-text-primary">Dark Mode</h4>
              <p className="text-[10px] text-brand-on-secondary-container mt-0.5">Use dark visuals across the app interface.</p>
            </div>
            <input
              type="checkbox"
              checked={darkMode}
              onChange={(e) => {
                const nextDark = e.target.checked;
                setDarkMode(nextDark);
                onSaveSettings({
                  ...settings,
                  accountName,
                  email,
                  darkMode: nextDark
                });
              }}
              className="h-4 w-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary bg-brand-surface-lowest cursor-pointer"
            />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl bg-brand-surface/60 space-y-6">
          <h3 className="font-geist text-sm font-bold text-brand-primary uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Security
          </h3>

          <p className="text-xs text-brand-on-secondary-container">
            End your current session securely by logging out from the workspace.
          </p>

          <button
            type="button"
            onClick={onLogout}
            className="w-full border border-brand-border text-brand-text-primary bg-transparent hover:bg-brand-primary-container/10 font-geist font-semibold py-3 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4 inline-block mr-2" />
            Logout
          </button>
        </div>

        <button
          type="submit"
          className="w-full bg-brand-primary-container text-white hover:brightness-110 font-geist font-bold py-3.5 rounded-xl shadow-lg transition-all cursor-pointer text-sm"
        >
          <Save className="w-4 h-4 inline-block mr-2" />
          Save Settings
        </button>
      </form>
    </div>
  );
}
