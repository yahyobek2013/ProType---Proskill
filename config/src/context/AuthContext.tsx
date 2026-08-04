import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, ActiveTab, SoundSettings } from '../types';
import { soundManager } from '../utils/sound';
import { resizeImageFile } from '../utils/imageUtils';

interface AuthContextType {
  user: User | null;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: 'login' | 'register';
  setAuthModalMode: (mode: 'login' | 'register') => void;
  login: (loginStr: string, passStr: string) => Promise<{ success: boolean; error?: string; redirectAdmin?: boolean }>;
  register: (data: { login: string; ism: string; familiya: string; password: string }) => Promise<{ success: boolean; error?: string; redirectAdmin?: boolean }>;
  logout: () => void;
  updateProfile: (data: Partial<User> & { password?: string }) => Promise<{ success: boolean; error?: string }>;
  uploadAvatar: (file: File) => Promise<{ success: boolean; avatar?: string; error?: string; message?: string }>;
  soundSettings: SoundSettings;
  updateSoundSettings: (settings: Partial<SoundSettings>) => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('protype_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTabState] = useState<ActiveTab>(() => {
    const savedUser = localStorage.getItem('protype_user');
    return savedUser ? 'mashq' : 'home';
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const [soundSettings, setSoundSettings] = useState<SoundSettings>(() => {
    try {
      const saved = localStorage.getItem('protype_sound');
      return saved ? JSON.parse(saved) : { enabled: true, volume: 0.6, soundType: 'mechanical' };
    } catch {
      return { enabled: true, volume: 0.6, soundType: 'mechanical' };
    }
  });

  useEffect(() => {
    soundManager.setSoundEnabled(soundSettings.enabled);
    soundManager.setVolume(soundSettings.volume);
    localStorage.setItem('protype_sound', JSON.stringify(soundSettings));
  }, [soundSettings]);

  const setActiveTab = (tab: ActiveTab) => {
    setActiveTabState(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const login = async (loginStr: string, passStr: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: loginStr, password: passStr }),
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || "Tizimga kirishda xatolik" };
      }

      setUser(data.user);
      localStorage.setItem('protype_user', JSON.stringify(data.user));
      setIsAuthModalOpen(false);

      if (data.redirectAdmin || data.user.role === 'admin' || (loginStr === 'yy' && passStr === 'yy')) {
        setActiveTab('admin');
      } else {
        setActiveTab('mashq');
      }

      return { success: true, redirectAdmin: data.redirectAdmin };
    } catch (err) {
      return { success: false, error: "Server bilan aloqa uzildi" };
    }
  };

  const register = async (regData: { login: string; ism: string; familiya: string; password: string }) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regData),
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || "Ro'yxatdan o'tishda xatolik" };
      }

      setUser(data.user);
      localStorage.setItem('protype_user', JSON.stringify(data.user));
      setIsAuthModalOpen(false);

      if (data.redirectAdmin || data.user.role === 'admin') {
        setActiveTab('admin');
      } else {
        setActiveTab('mashq');
      }

      return { success: true, redirectAdmin: data.redirectAdmin };
    } catch (err) {
      return { success: false, error: "Server bilan aloqa uzildi" };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('protype_user');
    setActiveTab('home');
  };

  const updateProfile = async (updateData: Partial<User> & { password?: string }) => {
    if (!user) return { success: false, error: "Tizimga kirmagansiz" };

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, ...updateData }),
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || "Profilni yangilashda xatolik" };
      }

      setUser(data.user);
      localStorage.setItem('protype_user', JSON.stringify(data.user));
      return { success: true };
    } catch (err) {
      return { success: false, error: "Server bilan bog'lanishda xatolik" };
    }
  };

  const uploadAvatar = async (file: File): Promise<{ success: boolean; avatar?: string; error?: string; message?: string }> => {
    if (!user) return { success: false, error: "Tizimga kirmagansiz" };

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      return {
        success: false,
        error: "Faqat JPG, JPEG, PNG va WEBP formatidagi rasmlar qabul qilinadi"
      };
    }

    if (file.size > 5 * 1024 * 1024) {
      return {
        success: false,
        error: "Fayl hajmi 5 MB dan oshmasligi kerak. Iltimos, kichikroq rasm tanlang."
      };
    }

    try {
      const resizedBase64 = await resizeImageFile(file, 800, 800, 0.92);

      const res = await fetch('/api/user/upload-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          imageBase64: resizedBase64,
          mimeType: file.type
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Profil rasmini saqlashda xatolik" };
      }

      if (data.user) {
        setUser(data.user);
        localStorage.setItem('protype_user', JSON.stringify(data.user));
      }

      return {
        success: true,
        avatar: data.avatar,
        message: data.message || "Profil rasmi muvaffaqiyatli saqlandi."
      };
    } catch (err: any) {
      return { success: false, error: err.message || "Server bilan aloqa xatosi" };
    }
  };

  const refreshUserData = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/users/leaderboard');
      if (res.ok) {
        const usersList: User[] = await res.json();
        const fresh = usersList.find(u => u.id === user.id);
        if (fresh) {
          setUser(fresh);
          localStorage.setItem('protype_user', JSON.stringify(fresh));
        }
      }
    } catch (err) {
      // Ignore
    }
  };

  const updateSoundSettings = (newSet: Partial<SoundSettings>) => {
    setSoundSettings(prev => ({ ...prev, ...newSet }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeTab,
        setActiveTab,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        login,
        register,
        logout,
        updateProfile,
        uploadAvatar,
        soundSettings,
        updateSoundSettings,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
