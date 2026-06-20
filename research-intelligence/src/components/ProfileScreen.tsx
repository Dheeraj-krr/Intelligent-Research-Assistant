import React, { useState } from 'react';
import { User } from '../types';

interface ProfileScreenProps {
    user?: User | null;
    onEdit?: () => void;
    onLogout: () => void;
}

export default function ProfileScreen({ user = null, onLogout, onEdit }: ProfileScreenProps) {
    const [copied, setCopied] = useState(false);

    if (!user) {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-semibold mb-4">Profile</h1>
                <p className="text-sm text-brand-on-secondary-container">No user data available.</p>
            </div>
        );
    }

    const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U';

    const copyEmail = async () => {
        try {
            await navigator.clipboard.writeText(user.email);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
        } catch (e) {
            // fallback: do nothing
        }
    };

    return (
        <div className="p-6 max-w-md">
            <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary overflow-hidden">
                    {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={`${user.name} avatar`} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-xl font-bold">{initials}</span>
                    )}
                </div>

                <div className="flex-1">
                    <h1 className="text-xl font-semibold text-brand-text-primary">{user.name}</h1>
                    <p className="text-[11px] text-brand-on-secondary-container truncate">{user.email}</p>
                    <div className="mt-2 flex items-center gap-2">
                        <span className={`text-[11px] px-2 py-1 rounded-full font-medium ${user.isPro ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'}`}>
                            {user.isPro ? 'Pro Member' : 'Standard User'}
                        </span>
                        <span className="text-[11px] text-brand-on-secondary-container font-mono">{user.tokenStatus}</span>
                    </div>
                </div>
            </div>

            <div className="mt-6 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-semibold">Name</p>
                        <p className="text-brand-on-secondary-container">{user.name}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-semibold">Email</p>
                        <p className="text-brand-on-secondary-container truncate">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={copyEmail} className="text-xs px-2 py-1 rounded-md bg-brand-surface-high/60 hover:bg-brand-surface-high transition">
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                    </div>
                </div>

                <div>
                    <p className="font-semibold">Token Status</p>
                    <p className="text-brand-on-secondary-container">{user.tokenStatus}</p>
                </div>
            </div>

            <div className="mt-6 flex gap-3">
                <button onClick={onEdit}    className="px-4 py-2 rounded-lg bg-brand-primary text-white text-sm font-medium"  >
                    Edit Profile
                </button>
                <button onClick={onLogout} className="px-4 py-2 rounded-lg border border-brand-border text-sm text-brand-on-secondary-container bg-transparent">Sign out</button>
            </div>
        </div>
    );
}