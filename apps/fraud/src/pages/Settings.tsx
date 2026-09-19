import { useState } from 'react';
import { Shield, Bell, User, Lock, X } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState({
    notifications: true,
    riskThreshold: 75,
    twoFactor: false,
    whitelist: ['Trusted Vendor Inc', 'Secure Supplies Co']
  });

  const [newWhitelist, setNewWhitelist] = useState('');

  return (
    
    <div className="min-h-screen bg-cyber-dark p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-cyber-primary mb-8 flex items-center gap-2">
        <Shield className="w-8 h-8" />
        Account Settings
      </h1>

      <div className="space-y-8">
        {/* Notification Settings */}
        <div className="bg-cyber-dark-secondary p-6 rounded-lg border border-cyber-primary/20">
          <h2 className="text-xl font-semibold text-cyber-primary mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => setSettings({...settings, notifications: e.target.checked})}
                className="w-4 h-4 text-cyber-primary"
              />
              Receive real-time fraud alerts
            </label>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-cyber-dark-secondary p-6 rounded-lg border border-cyber-primary/20">
          <h2 className="text-xl font-semibold text-cyber-primary mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Security
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block mb-2">Risk Threshold</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.riskThreshold}
                  onChange={(e) => setSettings({...settings, riskThreshold: Number(e.target.value)})}
                  className="w-48 accent-cyber-primary"
                />
                <span className="text-cyber-primary">
                  {settings.riskThreshold}%
                </span>
              </div>
            </div>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.twoFactor}
                onChange={(e) => setSettings({...settings, twoFactor: e.target.checked})}
                className="w-4 h-4 text-cyber-primary"
              />
              Enable Two-Factor Authentication
            </label>
          </div>
        </div>

        {/* Whitelist Management */}
        <div className="bg-cyber-dark-secondary p-6 rounded-lg border border-cyber-primary/20">
          <h2 className="text-xl font-semibold text-cyber-primary mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Trusted Vendors
          </h2>
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add new trusted vendor"
                className="flex-1 bg-cyber-dark border border-cyber-primary/20 rounded-lg p-2"
                value={newWhitelist}
                onChange={(e) => setNewWhitelist(e.target.value)}
              />
              <button
                onClick={() => {
                  if (newWhitelist) {
                    setSettings({
                      ...settings,
                      whitelist: [...settings.whitelist, newWhitelist]
                    });
                    setNewWhitelist('');
                  }
                }}
                className="bg-cyber-primary/20 px-4 py-2 rounded-lg hover:bg-cyber-primary/30 transition"
              >
                Add Vendor
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {settings.whitelist.map((vendor, index) => (
                <div key={index} className="flex items-center justify-between bg-cyber-dark p-2 rounded">
                  <span>{vendor}</span>
                  <button
                    onClick={() => setSettings({
                      ...settings,
                      whitelist: settings.whitelist.filter((_, i) => i !== index)
                    })}
                    className="text-cyber-alert hover:text-cyber-alert/80"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}