import React, { useState } from "react";
import { auth, db } from "../lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { UserProfile, UserType } from "../types";
import { LogIn, UserPlus, X, Info } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (profile: UserProfile) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [userType, setUserType] = useState<UserType>("family");
  const [budgetLimit, setBudgetLimit] = useState<number>(1000);
  const [currency, setCurrency] = useState("SAR");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        // Create user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create profile document
        const profile: UserProfile = {
          uid: user.uid,
          fullName,
          email,
          userType,
          budgetLimit,
          currency,
          createdAt: new Date().toISOString()
        };

        await setDoc(doc(db, "users", user.uid), profile);
        onAuthSuccess(profile);
      } else {
        // Sign In
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Fetch profile
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) {
          onAuthSuccess(docSnap.data() as UserProfile);
        } else {
          // If profile document missing, create a default one
          const defaultProfile: UserProfile = {
            uid: user.uid,
            fullName: user.displayName || "مستخدم ذكي",
            email: user.email || email,
            userType: "family",
            budgetLimit: 1500,
            currency: "SAR",
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, "users", user.uid), defaultProfile);
          onAuthSuccess(defaultProfile);
        }
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      let arabicError = "حدث خطأ أثناء الاتصال. يرجى التحقق من المدخلات.";
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        arabicError = "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
      } else if (err.code === "auth/email-already-in-use") {
        arabicError = "هذا البريد الإلكتروني مستخدم بالفعل.";
      } else if (err.code === "auth/weak-password") {
        arabicError = "كلمة المرور يجب أن تكون 6 أحرف على الأقل.";
      } else if (err.code === "auth/invalid-email") {
        arabicError = "صيغة البريد الإلكتروني غير صحيحة.";
      }
      setError(arabicError);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError("");
    setLoading(true);
    try {
      // Login with a demo profile (client-side mock profile backed by local storage or static profile)
      const demoProfile: UserProfile = {
        uid: "demo-user-123",
        fullName: "عائلة أحمد التجريبية",
        email: " أحمد@مثال.كوم",
        userType: "family",
        budgetLimit: 2000,
        currency: "SAR",
        familyCount: 5,
        preferences: "نفضل الأكلات الشعبية السريعة والوجبات قليلة الكربوهيدرات لمرضى السكر في العائلة.",
        createdAt: new Date().toISOString()
      };
      onAuthSuccess(demoProfile);
      onClose();
    } catch (err) {
      console.error(err);
      setError("فشل تسجيل الدخول التجريبي.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div id="auth-modal-card" className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden text-right" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            {isSignUp ? <UserPlus className="w-5 h-5 text-emerald-600" /> : <LogIn className="w-5 h-5 text-emerald-600" />}
            {isSignUp ? "إنشاء حساب جديد" : "تسجيل الدخول للمنصة"}
          </h3>
          <button id="close-auth-modal" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 font-medium">
              {error}
            </div>
          )}

          {isSignUp && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">الاسم الكامل</label>
              <input
                id="reg-full-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="مثال: أحمد الغامدي"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">البريد الإلكتروني</label>
            <input
              id="auth-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors ltr"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">كلمة المرور</label>
            <input
              id="auth-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors ltr"
              dir="ltr"
            />
          </div>

          {isSignUp && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">نوع المستخدم</label>
                <select
                  id="reg-user-type"
                  value={userType}
                  onChange={(e) => setUserType(e.target.value as UserType)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                >
                  <option value="family">عائلة</option>
                  <option value="employee">موظف</option>
                  <option value="student">طالب</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">ميزانية الطعام</label>
                <input
                  id="reg-budget-limit"
                  type="number"
                  required
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
          )}

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-sm shadow-emerald-600/10 hover:shadow-emerald-600/20 flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            {loading ? "جاري المعالجة..." : isSignUp ? "تسجيل الحساب" : "تسجيل الدخول"}
          </button>

          <div className="relative my-6 flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-xs text-slate-400 font-medium">أو جرب مباشرة</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <button
            id="demo-auth-btn"
            type="button"
            onClick={handleDemoLogin}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors border border-slate-200 flex items-center justify-center gap-2"
          >
            <Info className="w-4 h-4 text-slate-500" />
            الدخول بحساب تجريبي سريع
          </button>

          <div className="text-center pt-2">
            <button
              id="toggle-auth-mode"
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              {isSignUp ? "لديك حساب بالفعل؟ سجل دخولك" : "ليس لديك حساب؟ أنشئ حساباً مجانياً"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
