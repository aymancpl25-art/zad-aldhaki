import React, { useState } from "react";
import { UserProfile, Transaction } from "../types";
import { Plus, CreditCard, TrendingUp, Filter, AlertCircle, Trash2, Tag, Calendar, PieChart } from "lucide-react";

interface BudgetTrackerTabProps {
  userProfile: UserProfile;
  transactions: Transaction[];
  onAddTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export default function BudgetTrackerTab({ userProfile, transactions, onAddTransaction, onDeleteTransaction }: BudgetTrackerTabProps) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("بقالة 🛒");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const categories = [
    "بقالة 🛒",
    "مطاعم وتوصيل 🍔",
    "مستلزمات منزلية 🧻",
    "مشروبات وقهوة ☕",
    "طوارئ طعام 🚨"
  ];

  // Calculate stats
  const totalSpent = transactions.reduce((acc, t) => acc + t.amount, 0);
  const remainingBudget = userProfile.budgetLimit - totalSpent;
  const spentPercentage = Math.min((totalSpent / userProfile.budgetLimit) * 100, 100);

  // Filter transactions
  const filteredTransactions = filterCategory === "all"
    ? transactions
    : transactions.filter(t => t.category === filterCategory);

  const handleAddTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    const newTx: Transaction = {
      id: "tx-" + Date.now(),
      userId: userProfile.uid,
      amount: Number(amount),
      category,
      date,
      notes: notes.trim() || "عملية شراء عامة",
      createdAt: new Date().toISOString()
    };

    onAddTransaction(newTx);
    setAmount("");
    setNotes("");
  };

  // Specific user type advice
  const getBudgetAdvice = (type: string) => {
    switch (type) {
      case "family":
        return {
          title: "نصيحة العائلات للتوفير 👨‍👩‍👧‍👦",
          desc: "شراء الأساسيات (الأرز، الزيت، السكر، اللحوم المجمدة) بالجملة يقلل من فاتورة الطعام الإجمالية بنسبة تصل إلى 25%. ننصحك بتجنب التوصيل المتكرر من المطاعم المتقطعة."
        };
      case "employee":
        return {
          title: "نصيحة الموظفين للتوفير 💼",
          desc: "تحضير وجبات الغداء المكتبية في المساء (Meal Prep) يوفر عليك مبالغ هائلة تُصرف يومياً في تطبيقات التوصيل والمقاهي. استثمر في صندوق طعام عازل للحرارة."
        };
      case "student":
        return {
          title: "نصيحة الطلاب للتوفير 🎓",
          desc: "شارك مشتريات البقالة الأساسية مع زملائك في السكن لتقسيم الكلفة. اعتمد على مصادر بروتين اقتصادية وسهلة التحضير كالتونة، البيض، والعدس لفوائد صحية وميزانية ممتازة."
        };
      default:
        return null;
    }
  };

  const advice = getBudgetAdvice(userProfile.userType);

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Visual Analytics Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Spent vs Limit Card */}
        <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black text-gray-500 uppercase tracking-wider">مجموع المصروفات</span>
            <div className="p-2 bg-rose-50 rounded-lg text-rose-600 border border-rose-100">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-4xl font-black text-black">{totalSpent}</span>
            <span className="text-sm font-black text-gray-400 mr-1.5">{userProfile.currency || "SAR"}</span>
            <p className="text-xs text-gray-400 font-bold uppercase mt-1">من أصل ميزانية {userProfile.budgetLimit} {userProfile.currency}</p>
          </div>
          {/* Progress Indicator */}
          <div className="space-y-1">
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  spentPercentage > 90 ? "bg-red-500" : spentPercentage > 75 ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${spentPercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[11px] font-black text-gray-400">
              <span>{Math.round(spentPercentage)}% مستهلك</span>
              <span>{remainingBudget >= 0 ? `متبقي ${remainingBudget}` : `عجز ${Math.abs(remainingBudget)}`}</span>
            </div>
          </div>
        </div>

        {/* Remaining Budget Card */}
        <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black text-gray-500 uppercase tracking-wider">الميزانية المتبقية</span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-100">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className={`text-4xl font-black ${remainingBudget < 0 ? "text-red-600" : "text-emerald-600"}`}>
              {remainingBudget}
            </span>
            <span className="text-sm font-black text-gray-400 mr-1.5">{userProfile.currency || "SAR"}</span>
            <p className="text-xs text-gray-400 font-bold uppercase mt-1">المبلغ المتاح للتسوق والوجبات المتبقية للفترة.</p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-lg w-fit font-black border uppercase tracking-wider ${remainingBudget < 0 ? "bg-red-50 text-red-700 border-red-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"}`}>
            {remainingBudget < 0 ? "⚠️ تجاوزت الميزانية المحددة" : "✅ وضعك المالي ممتاز ومتزن"}
          </span>
        </div>

        {/* User Type Advice Widget */}
        {advice && (
          <div className="bg-emerald-950 text-white p-6 rounded-2xl border-2 border-emerald-900 shadow-sm flex flex-col justify-between space-y-3">
            <h4 className="text-xs font-black text-emerald-300 flex items-center gap-2 uppercase tracking-wider">
              <AlertCircle className="w-5 h-5 text-emerald-400" />
              {advice.title}
            </h4>
            <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed font-bold">
              {advice.desc}
            </p>
            <div className="text-[10px] text-emerald-300 font-black bg-emerald-900 px-2.5 py-1 rounded border border-emerald-800 w-fit uppercase tracking-wider">
              زاد الذكي • مخصص لك كـ {userProfile.userType === "family" ? "عائلة" : userProfile.userType === "employee" ? "موظف" : "طالب"}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Add Transaction Form */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm h-fit">
          <h3 className="text-lg font-black text-black mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-600" />
            تسجيل مصروفات جديدة
          </h3>

          <form onSubmit={handleAddTx} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">المبلغ المدفوع</label>
              <div className="relative">
                <input
                  id="tx-amount"
                  type="number"
                  required
                  step="any"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-black focus:outline-none focus:border-black transition-all text-left"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400">
                  {userProfile.currency || "SAR"}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">الفئة / التصنيف</label>
              <select
                id="tx-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-black focus:outline-none focus:border-black"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">تاريخ المعاملة</label>
              <input
                id="tx-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-black"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">ملاحظات / تفاصيل الشراء</label>
              <input
                id="tx-notes"
                type="text"
                placeholder="مثال: بقالة هايبر بنده للأسبوع"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm placeholder-gray-300 font-bold"
              />
            </div>

            <button
              id="submit-tx-btn"
              type="submit"
              className="w-full py-3.5 px-4 bg-black hover:bg-neutral-800 text-white font-black rounded-xl text-sm transition-all border-2 border-black flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              تسجيل المعاملة
            </button>
          </form>
        </div>

        {/* Right Side: Ledger Transactions History */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 mb-4 gap-3">
              <div>
                <h3 className="text-xl font-black text-black">سجل عمليات الشراء</h3>
                <p className="text-xs text-gray-400 mt-0.5 font-bold">تتبع كافة فواتير البقالة والطلبات الخاصة بك بالتفصيل.</p>
              </div>

              {/* Filtering tab */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  id="tx-filter"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border-2 border-gray-200 text-xs font-black"
                >
                  <option value="all">كافة الفئات</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Transactions List */}
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12 text-gray-400 space-y-2">
                <PieChart className="w-12 h-12 text-gray-250 mx-auto" />
                <p className="text-sm font-black text-black">لا توجد أي معاملات مسجلة حالياً</p>
                <p className="text-xs text-gray-400 font-bold">ابدأ بإدخال مشتريات طعامك لتتبع التوفير والمصروفات.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {filteredTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-4 bg-gray-50 hover:bg-slate-100 rounded-xl border-2 border-gray-100 flex items-center justify-between transition-colors gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white border-2 border-gray-200 flex items-center justify-center text-gray-500 shadow-sm">
                        <Tag className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-800 font-black">
                            {tx.category}
                          </span>
                          <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider flex items-center gap-0.5">
                            <Calendar className="w-3 h-3" />
                            {tx.date}
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-black mt-1">{tx.notes}</h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-left">
                        <span className="text-sm font-black text-rose-600">
                          -{tx.amount}
                        </span>
                        <span className="text-[10px] font-black text-gray-400 mr-1">{userProfile.currency || "SAR"}</span>
                      </div>
                      
                      <button
                        id={`delete-tx-${tx.id}`}
                        onClick={() => onDeleteTransaction(tx.id)}
                        className="p-1.5 hover:bg-rose-50 rounded-lg text-gray-400 hover:text-rose-600 transition-colors"
                        title="حذف المعاملة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {transactions.length > 0 && (
            <div className="border-t border-gray-100 pt-3 mt-4 text-left">
              <span className="text-xs text-gray-400 font-black uppercase tracking-wider">
                إجمالي المعاملات المكتملة: {transactions.length} عملية
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
