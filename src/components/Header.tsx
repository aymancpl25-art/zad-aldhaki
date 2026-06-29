import { UserProfile } from "../types";
import { LogIn, LogOut, User, ShoppingBag, Calendar, CreditCard, Apple } from "lucide-react";

interface HeaderProps {
  userProfile: UserProfile | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Header({ userProfile, onLoginClick, onLogoutClick, activeTab, setActiveTab }: HeaderProps) {
  // Map userType keys to Arabic friendly labels and color schemes
  const getUserTypeBadge = (type: string) => {
    switch (type) {
      case "family":
        return { label: "عائلي 👨‍👩‍👧‍👦", bg: "bg-teal-50 text-teal-700 border-teal-200" };
      case "employee":
        return { label: "موظف 💼", bg: "bg-blue-50 text-blue-700 border-blue-200" };
      case "student":
        return { label: "طالب 🎓", bg: "bg-amber-50 text-amber-700 border-amber-200" };
      default:
        return { label: "مستخدم", bg: "bg-slate-50 text-slate-700 border-slate-200" };
    }
  };

  const badge = userProfile ? getUserTypeBadge(userProfile.userType) : null;

  const navItems = [
    { id: "meals", label: "خطة الوجبات", icon: Calendar },
    { id: "budget", label: "مراقب الميزانية", icon: CreditCard },
    { id: "shopping", label: "قائمة التسوق", icon: ShoppingBag },
    { id: "profile", label: "الملف الشخصي", icon: User },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-100 shadow-sm" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/10 hover:scale-105 transition-transform">
              <Apple className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black tracking-tighter text-emerald-600 flex items-center gap-1">
                زاد <span className="text-black">الذكي.</span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] bg-emerald-100 text-emerald-800 rounded font-bold">SaaS</span>
              </span>
              <p className="hidden sm:block text-[9px] text-gray-400 font-bold uppercase tracking-wider">تخطيط وجبات وميزانية ذكية</p>
            </div>
          </div>

          {/* Navigation Links (visible when logged in/demo mode is active) */}
          {userProfile && (
            <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-gray-400">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    id={`nav-tab-${item.id}`}
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`transition-colors relative py-2 ${
                      isActive
                        ? "text-emerald-600 font-black text-base"
                        : "text-gray-400 hover:text-black font-bold"
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
                    )}
                  </button>
                );
              })}
            </nav>
          )}

          {/* User Auth Info & Controls */}
          <div className="flex items-center gap-3">
            {userProfile ? (
              <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold leading-none text-right">{userProfile.fullName}</p>
                  <p className="text-[10px] text-gray-400 font-bold text-right mt-1">{badge?.label}</p>
                </div>
                
                {/* Custom Avatar with Emerald Border */}
                <div className="w-8 h-8 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center text-emerald-700 font-black text-xs">
                  {userProfile.fullName.charAt(0)}
                </div>

                <button
                  id="header-logout-btn"
                  onClick={onLogoutClick}
                  className="p-1.5 hover:bg-red-50 hover:text-red-600 text-slate-500 rounded-full transition-colors"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="header-login-btn"
                onClick={onLoginClick}
                className="flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-neutral-800 text-white font-extrabold rounded-xl text-xs transition-all"
              >
                <LogIn className="w-4 h-4" />
                دخول / تسجيل حساب
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sub Navigation Bar (when user logged in) */}
      {userProfile && (
        <div className="md:hidden flex items-center justify-around border-t border-slate-100 py-2 px-2 bg-slate-50">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                id={`nav-tab-mobile-${item.id}`}
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-lg text-[11px] font-bold transition-all ${
                  isActive ? "text-emerald-700 bg-emerald-100/60 font-black" : "text-slate-500 hover:text-emerald-600"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
