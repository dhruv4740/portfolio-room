import { useState } from 'react';
import { User, Lock, ShieldAlert, Clock, LogOut, Key, Mail } from 'lucide-react';
import { useAuthState, auth, signOut } from '../firebase/firebase';
import Loading from '../components/Loading';

export default function Profile() {
  const [user] = useAuthState(auth);
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    name: user?.displayName || 'CyberSec User',
    email: user?.email || 'secure@business.com',
    twoFactorEnabled: false
  });

  if (!user) return <Loading />;

  return (
    
      <div className="min-h-screen bg-cyber-dark text-gray-100">
        <main className="container mx-auto p-6 max-w-4xl">
          <h1 className="text-3xl font-bold text-cyber-primary mb-8 flex items-center gap-3">
            <User className="w-8 h-8" />
            Account Profile
          </h1>

          <div className="space-y-8">
            {/* Profile Section */}
            <div className="bg-cyber-dark-secondary p-6 rounded-xl border border-cyber-primary/20">
              <h2 className="text-xl font-semibold text-cyber-primary mb-6 flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </h2>

              <div className="space-y-4">
                <form
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setIsEditing(false);
                  }}
                >
                  <InfoField
                    label="Full Name"
                    value={userData.name}
                    icon={<User className="w-4 h-4" />}
                    editable={isEditing}
                    onChange={(v) => setUserData({ ...userData, name: v })}
                  />
                  <InfoField
                    label="Email"
                    value={userData.email}
                    icon={<Mail className="w-4 h-4" />}
                    editable={isEditing}
                    onChange={(v) => setUserData({ ...userData, email: v })}
                  />
                  {isEditing && (
                    <div className="md:col-span-2">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-cyber-primary text-cyber-dark rounded-lg hover:bg-cyber-primary/90 transition"
                      >
                        Save Changes
                      </button>
                    </div>
                  )}
                </form>

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-4 py-2 bg-cyber-primary/20 text-cyber-primary rounded-lg hover:bg-cyber-primary/30 transition"
                  >
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                  </button>
                  <button
                    onClick={() => signOut(auth)}
                    className="px-4 py-2 bg-cyber-alert/20 text-cyber-alert rounded-lg hover:bg-cyber-alert/30 transition"
                  >
                    <LogOut className="inline mr-2 w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div className="bg-cyber-dark-secondary p-6 rounded-xl border border-cyber-primary/20">
              <h2 className="text-xl font-semibold text-cyber-primary mb-6 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" />
                Security Settings
              </h2>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-cyber-dark rounded-lg">
                  <div className="flex items-center gap-3">
                    <Key className="w-5 h-5 text-cyber-primary" />
                    <div>
                      <h3 className="text-cyber-primary">Password</h3>
                      <p className="text-sm text-gray-400">
                        {user.providerData[0]?.providerId === 'password'
                          ? 'Last changed 3 days ago'
                          : 'Managed by ' + user.providerData[0]?.providerId}
                      </p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-cyber-primary/20 text-cyber-primary rounded-lg hover:bg-cyber-primary/30 transition">
                    Change Password
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-cyber-dark rounded-lg">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-cyber-primary" />
                    <div>
                      <h3 className="text-cyber-primary">Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-400">
                        {userData.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setUserData({ ...userData, twoFactorEnabled: !userData.twoFactorEnabled })
                    }
                    className={`px-4 py-2 rounded-lg transition ${
                      userData.twoFactorEnabled
                        ? 'bg-green-400/20 text-green-400 hover:bg-green-400/30'
                        : 'bg-cyber-primary/20 text-cyber-primary hover:bg-cyber-primary/30'
                    }`}
                  >
                    {userData.twoFactorEnabled ? 'Disable' : 'Enable'}
                  </button>
                </div>

                <div className="p-4 bg-cyber-dark rounded-lg">
                  <h3 className="text-cyber-primary mb-4 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5" />
                    Connected Accounts
                  </h3>
                  <div className="space-y-3">
                    {user.providerData.map((provider, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-cyber-dark-secondary rounded-lg">
                        <span className="text-cyber-primary">
                          {provider.providerId.replace('.com', '')}
                        </span>
                        <span className="text-gray-400 text-sm">{provider.email}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Log */}
            <div className="bg-cyber-dark-secondary p-6 rounded-xl border border-cyber-primary/20">
              <h2 className="text-xl font-semibold text-cyber-primary mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Activity
              </h2>
              
              <div className="space-y-4">
                <ActivityLogItem
                  icon={<ShieldAlert className="w-4 h-4" />}
                  title="Password Changed"
                  timestamp="2 hours ago"
                />
                <ActivityLogItem
                  icon={<User className="w-4 h-4" />}
                  title="Profile Updated"
                  timestamp="1 day ago"
                />
                <ActivityLogItem
                  icon={<LogOut className="w-4 h-4" />}
                  title="Logged in from new device"
                  timestamp="3 days ago"
                />
              </div>
            </div>
          </div>
        </main>
      </div>
  );
}

// Reusable Components
const InfoField = ({
  label,
  value,
  icon,
  editable,
  onChange
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  editable: boolean;
  onChange: (value: string) => void;
}) => (
  <div className="space-y-2">
    <label className="text-sm text-cyber-primary flex items-center gap-2">
      {icon}
      {label}
    </label>
    {editable ? (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-cyber-dark border border-cyber-primary/20 rounded-lg p-2 text-cyber-primary"
      />
    ) : (
      <p className="bg-cyber-dark p-2 rounded-lg border border-cyber-primary/20">{value}</p>
    )}
  </div>
);

const ActivityLogItem = ({
  icon,
  title,
  timestamp
}: {
  icon: React.ReactNode;
  title: string;
  timestamp: string;
}) => (
  <div className="flex items-center justify-between p-3 bg-cyber-dark rounded-lg border border-cyber-primary/20 hover:border-cyber-primary/40 transition">
    <div className="flex items-center gap-3">
      <span className="text-cyber-primary">{icon}</span>
      <span>{title}</span>
    </div>
    <span className="text-sm text-gray-400">{timestamp}</span>
  </div>
);
