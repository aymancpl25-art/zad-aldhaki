import React, { useState } from "react";
import { UserProfile, UserType } from "../types";
import { User, Sparkles, Save, ShieldAlert, Coins, HelpCircle } from "lucide-react";

interface ProfileTabProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
}

export default function ProfileTab({ userProfile, onUpdateProfile }: ProfileTabProps) {
  const [fullName, setFullName] = useState(userProfile.fullName);
  const [userType, setUserType] = useState<UserType>(userProfile.userType);
  const [budgetLimit, setBudgetLimit] = useState(userProfile.budgetLimit);
  const [currency, setCurrency] = useState(userProfile.currency || "SAR");
  const [familyCount, setFamilyCount] = useState(userProfile.familyCount || 4);
  const [preferences, setPreferences] = useState(userProfile.preferences || "");
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);

    const updated: UserProfile = {
      ...userProfile,
      fullName,
      userType,
      budgetLimit: Number(budgetLimit),
      currency,
      familyCount: userType === "family" ? Number(familyCount) : undefined,
      preferences: preferences.trim()
    };

    onUpdateProfile(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-right" dir="rtl">
      <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm">
        <h3 className="text-xl font-black text-black mb-2 flex items-center gap-2">
          <User className="w-5.5 h-5.5 text-emerald-600" />
          تعديل الملف الشخصي وتفضيلات الطعام
        </h3>
        <p className="text-xs text-gray-400 font-bold">يستخدم التطبيق والذكاء الاصطناعي هذه المعطيات لتوليد جداول وجبات وحسابات ميزانية مخصصة ودقيقة لك.</p>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {saved && (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border-2 border-emerald-100 text-sm font-black">
              🎉 تم حفظ البيانات وتحديث تفضيلاتك الذكية بنجاح!
            </div>
          )}

          {/* Core Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">الاسم الكامل</label>
              <input
                id="profile-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-bold focus:outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">البريد الإلكتروني</label>
              <input
                id="profile-email"
                type="email"
                disabled
                value={userProfile.email}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm bg-gray-50 text-gray-400 cursor-not-allowed ltr"
                dir="ltr"
              />
            </div>
          </div>

          {/* Budget Limit & Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">الحد المالي للميزانية للفترة</label>
              <input
                id="profile-budget"
                type="number"
                required
                value={budgetLimit}
                onChange={(e) => setBudgetLimit(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-black text-black"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">العملة المفضلة</label>
              <select
                id="profile-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-black text-black"
              >
                <option value="SAR">ريال سعودي (SAR)</option>
                <option value="EGP">جنيه مصري (EGP)</option>
                <option value="AED">درهم إماراتي (AED)</option>
                <option value="KWD">دينار كويتي (KWD)</option>
                <option value="QAR">ريال قطري (QAR)</option>
                <option value="USD">دولار أمريكي (USD)</option>
              </select>
            </div>
          </div>

          {/* User Type & Config */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">فئة اشتراك المستخدم (مهم لتخصيص الخطة)</label>
              <select
                id="profile-usertype"
                value={userType}
                onChange={(e) => setUserType(e.target.value as UserType)}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-black text-black"
              >
                <option value="family">عائلة 👨‍👩‍👧‍👦 (تخطيط كميات أكبر ونصائح جملة)</option>
                <option value="employee">موظف 💼 (تحضير وجبات سريعة وصندوق طعام)</option>
                <option value="student">طالب 🎓 (ميزانية اقتصادية جداً ومكونات بسيطة)</option>
              </select>
            </div>

            {userType === "family" && (
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">عدد أفراد العائلة</label>
                <input
                  id="profile-familycount"
                  type="number"
                  required
                  min={1}
                  value={familyCount}
                  onChange={(e) => setFamilyCount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-black text-black"
                />
              </div>
            )}
          </div>

          {/* AI Instructions preferences */}
          <div className="space-y-1">
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5 justify-end">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              تعليمات وتفضيلات طهي إضافية للذكاء الاصطناعي (أرجية، دايت، نوع وجبات)
            </label>
            <textarea
              id="profile-preferences"
              rows={3}
              placeholder="مثال: طعام عالي البروتين، خالي من الجلوتين، نفضل الأكلات الشرقية، تقليل النشويات للدايت..."
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              className="w-full p-4 rounded-xl border-2 border-gray-200 text-sm font-bold focus:outline-none focus:border-black"
            ></textarea>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">سيقوم نموذج Gemini بقراءة هذه الخصائص وتوليد خطة وجبات مصممة بدقة لتلبيتها بالكامل.</p>
          </div>

          {/* Submit */}
          <button
            id="save-profile-btn"
            type="submit"
            className="w-full py-3.5 px-4 bg-black hover:bg-neutral-800 text-white font-black rounded-xl text-sm transition-all border-2 border-black flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            حفظ التغييرات
          </button>
        </form>
      </div>

      {/* Membership level / Premium perks info */}
      <div className="bg-emerald-950 text-white p-8 rounded-2xl border-2 border-emerald-900 space-y-4 shadow-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-24 h-24 bg-white/5 rounded-full -translate-x-8 -translate-y-8"></div>
        
        <div className="flex items-center gap-2 text-emerald-400">
          <ShieldAlert className="w-5 h-5" />
          <span className="text-xs font-black tracking-wider uppercase">باقة زاد الذكي الاحترافية • زاد PRO</span>
        </div>
        
        <div className="space-y-1">
          <h4 className="text-lg font-black tracking-tighter">ميزانيتك تحت السيطرة الدائمة 🔐</h4>
          <p className="text-xs text-emerald-100 leading-relaxed max-w-xl font-bold">
            بصفتك مشتركاً متميزاً، يحق لك الوصول غير المحدود إلى مولّد الوجبات الذكي، سجل معاملات مالي فوري ممتد للأشهر السابقة، وخاصية المزامنة السريعة لقوائم التسوق عبر الواتساب والبريد مجاناً!
          </p>
        </div>
      </div>
    </div>
  );
}
