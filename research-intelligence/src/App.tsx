declare module 'react';

import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { motion, AnimatePresence } from 'motion/react';

import ProfileScreen from './components/ProfileScreen';

import {

  ChatSession,
  AppSettings,


  User,
  FileType
} from './types';

import {
  DEFAULT_USER,
  INITIAL_DOCUMENTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_CHAT_HISTORY,
  INITIAL_SETTINGS
} from './mockData';

import Sidebar from './components/Sidebar';
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import DashboardView from './components/DashboardView';
import ProjectsViewEnhanced from "./components/ProjectsViewEnhanced";
import SettingsView from './components/SettingsView';
import UploadsView from './components/UploadsView';
import ConversationsView from "./components/ConversationsView";

export default function App() {
  // Navigation / Tab state
  const [currentTab, setCurrentTab] = useState<string>('register');
  const [isAuthMode, setIsAuthMode] = useState<'login' | 'register' | 'authenticated'>('register'); // Auth starts logged in for presentation

  // Application database states
  const [user, setUser] = useState<User | null>(DEFAULT_USER);
  const [documents, setDocuments] = useState<DocumentItem[]>(INITIAL_DOCUMENTS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>(INITIAL_CHAT_HISTORY);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);

  useEffect(() => {

    const token = localStorage.getItem("token");

    if (token) {

      try {

        const decoded: any =
          jwtDecode(token);

        const currentTime =
          Date.now() / 1000;

        if (decoded.exp < currentTime) {

          localStorage.removeItem("token");

          localStorage.removeItem("userEmail");

          localStorage.removeItem("userName");

          setIsAuthMode("login");

          return;
        }

        const savedName =
          localStorage.getItem("userName");

        const savedEmail =
          localStorage.getItem("userEmail");

        setUser({

          name: savedName || "",

          email: savedEmail || "",

          isPro: true,

          tokenStatus: "Active",

          tokenExpiresIn: "60 min",

          avatarUrl:
            DEFAULT_USER.avatarUrl
        });

        setIsAuthMode(
          "authenticated"
        );

        setCurrentTab(
          "dashboard"
        );

      } catch (error) {

        console.log(error);

        localStorage.removeItem("token");

        setIsAuthMode("login");
      }
    }

  }, []);



  useEffect(() => {
    if (!user) return;
    setSettings((prev) => ({
      ...prev,
      accountName: user.name,
      email: user.email
    }));
  }, [user?.name, user?.email]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = settings.darkMode ? 'dark' : 'light';

    if (settings.darkMode) {
      root.style.setProperty('--color-brand-bg', '#031427');
      root.style.setProperty('--color-brand-surface', '#0f172a');
      root.style.setProperty('--color-brand-border', '#1e293b');
      root.style.setProperty('--color-brand-text-primary', '#f8fafc');
      root.style.setProperty('--color-brand-text-secondary', '#94a3b8');
      root.style.setProperty('--color-brand-primary', '#b4c5ff');
      root.style.setProperty('--color-brand-on-primary', '#002a78');
      root.style.setProperty('--color-brand-primary-container', '#2563eb');
      root.style.setProperty('--color-brand-on-primary-container', '#eeefff');
      root.style.setProperty('--color-brand-secondary', '#bec6e0');
      root.style.setProperty('--color-brand-secondary-container', '#3f465c');
      root.style.setProperty('--color-brand-on-secondary-container', '#adb4ce');
      root.style.setProperty('--color-brand-tertiary', '#7bd0ff');
      root.style.setProperty('--color-brand-tertiary-container', '#00759f');
      root.style.setProperty('--color-brand-on-tertiary-container', '#e1f2ff');
      root.style.setProperty('--color-brand-surface-lowest', '#000f21');
      root.style.setProperty('--color-brand-surface-low', '#0b1c30');
      root.style.setProperty('--color-brand-surface-container', '#102034');
      root.style.setProperty('--color-brand-surface-high', '#1b2b3f');
      root.style.setProperty('--color-brand-surface-highest', '#26364a');
      root.style.setProperty('--color-brand-outline', '#8d90a0');
      root.style.setProperty('--color-brand-outline-variant', '#434655');
      root.style.setProperty('--color-brand-error', '#ffb4ab');
      root.style.setProperty('--color-brand-error-container', '#93000a');
      root.style.setProperty('--color-brand-on-error-container', '#ffdad6');
    } else {
      root.style.setProperty('--color-brand-bg', '#f8fafc');
      root.style.setProperty('--color-brand-surface', '#ffffff');
      root.style.setProperty('--color-brand-border', '#cbd5e1');
      root.style.setProperty('--color-brand-text-primary', '#0f172a');
      root.style.setProperty('--color-brand-text-secondary', '#475569');
      root.style.setProperty('--color-brand-primary', '#2563eb');
      root.style.setProperty('--color-brand-on-primary', '#ffffff');
      root.style.setProperty('--color-brand-primary-container', '#e0e7ff');
      root.style.setProperty('--color-brand-on-primary-container', '#1e3a8a');
      root.style.setProperty('--color-brand-secondary', '#64748b');
      root.style.setProperty('--color-brand-secondary-container', '#e2e8f0');
      root.style.setProperty('--color-brand-on-secondary-container', '#475569');
      root.style.setProperty('--color-brand-tertiary', '#0ea5e9');
      root.style.setProperty('--color-brand-tertiary-container', '#bae6fd');
      root.style.setProperty('--color-brand-on-tertiary-container', '#0c4a6e');
      root.style.setProperty('--color-brand-surface-lowest', '#f8fafc');
      root.style.setProperty('--color-brand-surface-low', '#e2e8f0');
      root.style.setProperty('--color-brand-surface-container', '#f1f5f9');
      root.style.setProperty('--color-brand-surface-high', '#cbd5e1');
      root.style.setProperty('--color-brand-surface-highest', '#94a3b8');
      root.style.setProperty('--color-brand-outline', '#94a3b8');
      root.style.setProperty('--color-brand-outline-variant', '#64748b');
      root.style.setProperty('--color-brand-error', '#b91c1c');
      root.style.setProperty('--color-brand-error-container', '#fecaca');
      root.style.setProperty('--color-brand-on-error-container', '#7f1d1d');
    }
  }, [settings.darkMode]);


  const getNameFromEmail = (email: string) => {
    const localPart = email.split('@')[0] || '';
    const normalized = localPart
      .replace(/[._]/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');

    return normalized || 'Researcher';
  };

  // Auth screen actions
  const handleLoginSuccess = (email: string) => {
    const researcherName = getNameFromEmail(email);
    setUser({
      name: researcherName,
      email,
      isPro: true,
      tokenStatus: 'Active',
      tokenExpiresIn: '12h',
      avatarUrl: DEFAULT_USER.avatarUrl
    });

    localStorage.setItem('userEmail', email);

    setIsAuthMode('authenticated');
    setCurrentTab('Login'); // After login, default to dashboard view
  };


  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    setUser(null);
    setIsAuthMode('register');
    setCurrentTab('register');
  };

  const handleRegisterSuccess = (name: string, email: string) => {

    localStorage.setItem("userName", name);
    localStorage.setItem("userEmail", email);

  };



  // Main UI rendering
  const renderActiveTab = () => {
    if (!user) return null;

    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardView
            user={user}
            documents={documents}
            chatHistory={chatHistory}
            onSelectTab={setCurrentTab}
          />
        );

      case 'settings':
        return (
          <SettingsView
            settings={settings}
            onSaveSettings={(newSet) => {
              setSettings(newSet);
              if (user) {
                setUser({
                  ...user,
                  name: newSet.accountName,
                  email: newSet.email
                });
              }
            }}
            onLogout={handleLogout}
          />
        );

      case 'profile':
        return (
          <ProfileScreen
            user={user}
            onLogout={handleLogout}
          />
        );

      case 'projects':
        return (
          <ProjectsViewEnhanced />
        );

      case 'uploads':
        return (
          <UploadsView />
        );

      case 'conversations':
        return (
          <ConversationsView />
        );
      default:
        return (
          <DashboardView
            user={user}
            documents={documents}
            chatHistory={chatHistory}
            onSelectTab={setCurrentTab}
          />
        );
    }
  };

  // Render Login / Register workflow
  if (isAuthMode === 'login') {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        onNavigateToRegister={() => setIsAuthMode('register')}
      />
    );
  }

  if (isAuthMode === 'register') {
    return (
      <RegisterScreen
        onRegisterSuccess={handleRegisterSuccess}
        onNavigateToLogin={() => setIsAuthMode('login')}
      />
    );
  }

  return (
    <div
      className={`min-h-screen bg-brand-bg text-brand-primary font-sans h-full relative ${settings.highContrast ? 'border-4 border-dashed border-brand-primary/40' : ''
        }`}
    >
      {/* Background Decorative Blur Gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/6 right-1/4 w-[500px] h-[500px] bg-brand-primary-container/5 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/5 left-1/3 w-[450px] h-[450px] bg-brand-tertiary-container/5 rounded-full blur-[90px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Side Navigation panel */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        user={user}
        onLogout={handleLogout}

      />

      {/* Inner main canvas workspace */}
      <div className="pl-64 min-h-screen relative z-10">
        {/* Dynamic header row indicator */}
        <header className="px-8 py-5 border-b border-brand-border/40 bg-brand-surface-lowest/40 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse col-span-1 shadow-[0_0_8px_#10b981]"></span>
            <span className="text-[10px] uppercase font-geist tracking-widest text-[#94a3b8] font-bold">Research Station  Active</span>
          </div>


        </header>

        {/* Selected View Window with AnimatePresence */}
        <main className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {renderActiveTab()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
