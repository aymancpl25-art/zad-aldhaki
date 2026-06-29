import React, { useState } from "react";
import { UserProfile, MealPlan, DayPlan, Meal, DailyMeals } from "../types";
import { Sparkles, Check, RefreshCw, Plus, Calendar, AlertCircle, ShoppingCart, HelpCircle } from "lucide-react";

interface MealPlanTabProps {
  userProfile: UserProfile;
  mealPlan: MealPlan | null;
  onUpdateMealPlan: (newPlan: MealPlan) => void;
  onAddAllToShoppingList: (ingredients: { name: string; category: string; quantity: string }[]) => void;
}

export default function MealPlanTab({ userProfile, mealPlan, onUpdateMealPlan, onAddAllToShoppingList }: MealPlanTabProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [planType, setPlanType] = useState<"weekly" | "monthly">("weekly");
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // Manual Add Form State
  const [isAddingMeal, setIsAddingMeal] = useState(false);
  const [newMealDay, setNewMealDay] = useState("السبت");
  const [newMealType, setNewMealType] = useState<keyof DailyMeals>("breakfast");
  const [newMealName, setNewMealName] = useState("");
  const [newMealCategory, setNewMealCategory] = useState("بروتينات");
  const [newMealCost, setNewMealCost] = useState(15);
  const [newMealIngredients, setNewMealIngredients] = useState("");

  const daysList = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];

  const handleGenerateAIPlan = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/generate-meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userType: userProfile.userType,
          budgetLimit: userProfile.budgetLimit,
          currency: userProfile.currency || "SAR",
          planType,
          preferences: userProfile.preferences || "منوع، صحي وموفر",
          familyCount: userProfile.familyCount || 4,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "فشل توليد الخطة بالذكاء الاصطناعي");
      }

      const generatedPlan: MealPlan = {
        id: "ai-generated-" + Date.now(),
        userId: userProfile.uid,
        planType,
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        meals: data.days,
        totalEstimatedCost: data.totalEstimatedCost,
        savingTips: data.savingTips || [],
        createdAt: new Date().toISOString()
      };

      onUpdateMealPlan(generatedPlan);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "حدث خطأ غير متوقع أثناء توليد الخطة. يرجى مراجعة مفتاح API الخاص بـ Gemini في الإعدادات.");
    } finally {
      setLoading(false);
    }
  };

  const handleMealCompletionToggle = (dayIndex: number, mealType: keyof DailyMeals) => {
    if (!mealPlan) return;

    const updatedMeals = [...mealPlan.meals];
    const currentMeal = updatedMeals[dayIndex].meals[mealType];
    updatedMeals[dayIndex].meals[mealType] = {
      ...currentMeal,
      isCompleted: !currentMeal.isCompleted
    };

    onUpdateMealPlan({
      ...mealPlan,
      meals: updatedMeals
    });
  };

  const handleAddMealManually = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMealName.trim()) return;

    const mealItem: Meal = {
      name: newMealName,
      category: newMealCategory,
      estimatedCost: Number(newMealCost),
      ingredients: newMealIngredients.split(",").map(i => i.trim()).filter(Boolean),
      isCompleted: false
    };

    let updatedMeals: DayPlan[] = mealPlan ? [...mealPlan.meals] : [];

    if (updatedMeals.length === 0) {
      // Initialize empty week structure if none exists
      updatedMeals = daysList.map(dayName => ({
        dayName,
        meals: {
          breakfast: { name: "لا توجد وجبة مضافة", category: "-", estimatedCost: 0, ingredients: [] },
          lunch: { name: "لا توجد وجبة مضافة", category: "-", estimatedCost: 0, ingredients: [] },
          dinner: { name: "لا توجد وجبة مضافة", category: "-", estimatedCost: 0, ingredients: [] },
          snack: { name: "لا توجد وجبة مضافة", category: "-", estimatedCost: 0, ingredients: [] },
        }
      }));
    }

    const dayIndex = updatedMeals.findIndex(d => d.dayName === newMealDay);
    if (dayIndex !== -1) {
      updatedMeals[dayIndex].meals[newMealType] = mealItem;
    }

    // Calculate total cost
    const totalCost = updatedMeals.reduce((acc, day) => {
      const { breakfast, lunch, dinner, snack } = day.meals;
      return acc + (breakfast?.estimatedCost || 0) + (lunch?.estimatedCost || 0) + (dinner?.estimatedCost || 0) + (snack?.estimatedCost || 0);
    }, 0);

    const updatedPlan: MealPlan = {
      id: mealPlan?.id || "manual-plan-" + Date.now(),
      userId: userProfile.uid,
      planType,
      startDate: mealPlan?.startDate || new Date().toISOString().split("T")[0],
      endDate: mealPlan?.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      meals: updatedMeals,
      totalEstimatedCost: totalCost,
      savingTips: mealPlan?.savingTips || ["خطط لوجباتك مسبقاً وتجنب الشراء غير المخطط له."],
      createdAt: mealPlan?.createdAt || new Date().toISOString()
    };

    onUpdateMealPlan(updatedPlan);
    setIsAddingMeal(false);
    setNewMealName("");
    setNewMealIngredients("");
  };

  const collectAllIngredients = () => {
    if (!mealPlan) return [];
    const list: { name: string; category: string; quantity: string }[] = [];
    mealPlan.meals.forEach(day => {
      Object.keys(day.meals).forEach(key => {
        const meal = day.meals[key as keyof DailyMeals];
        if (meal && meal.ingredients && meal.ingredients.length > 0 && meal.name !== "لا توجد وجبة مضافة") {
          meal.ingredients.forEach(ing => {
            // Give it a generic default quantity or map nicely
            list.push({
              name: ing,
              category: meal.category || "عام",
              quantity: "حسب الحاجة"
            });
          });
        }
      });
    });
    return list;
  };

  const handleSyncToShopping = () => {
    const ings = collectAllIngredients();
    if (ings.length === 0) return;
    onAddAllToShoppingList(ings);
    alert(`تم مزامنة ${ings.length} مكوناً وإضافتها لقائمة التسوق بنجاح! 🎉`);
  };

  const currentDayPlan = mealPlan?.meals[selectedDayIndex];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Intro Dashboard Card */}
      <div className="bg-emerald-900 text-white p-8 rounded-[32px] border-2 border-emerald-800 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full -translate-x-12 -translate-y-12"></div>
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full translate-x-12 translate-y-12"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800 text-emerald-300 text-xs font-black uppercase tracking-wider border border-emerald-700">
              <Sparkles className="w-3.5 h-3.5" />
              تخطيط ذكي مخصص بالكامل
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tighter leading-none">أهلاً بك في منظم طعامك الذكي!</h2>
            <p className="text-emerald-100/90 max-w-xl text-sm leading-relaxed font-semibold">
              وفّر وقتك وميزانيتك من خلال إعداد خطة وجبات مصممة بدقة لتناسب احتياجات{" "}
              {userProfile.userType === "family" ? `عائلتك المكونة من ${userProfile.familyCount || 4} أفراد` : userProfile.userType === "employee" ? "عملك كموظف مشغول" : "جدولك كطالب"} وبميزانية لا تتخطى <span className="font-bold underline text-white">{userProfile.budgetLimit} {userProfile.currency}</span>.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="bg-emerald-800/80 p-4 rounded-xl border border-emerald-700 text-center min-w-[120px]">
              <span className="block text-xs font-black text-emerald-300 uppercase tracking-wider">الحد الأقصى</span>
              <span className="text-xl sm:text-2xl font-black">{userProfile.budgetLimit} {userProfile.currency}</span>
            </div>
            {mealPlan && (
              <div className="bg-emerald-950 p-4 rounded-xl border border-emerald-800 text-center min-w-[120px]">
                <span className="block text-xs font-black text-emerald-300 uppercase tracking-wider">الخطة الحالية</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-400">{mealPlan.totalEstimatedCost} {userProfile.currency}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Control Actions & Selection */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Toggle Weekly vs Monthly */}
        <div className="flex p-1 bg-gray-100 rounded-xl border-2 border-gray-200 w-fit">
          <button
            id="plan-type-weekly-btn"
            onClick={() => setPlanType("weekly")}
            className={`px-4 py-2 text-xs sm:text-sm font-black rounded-lg transition-all ${
              planType === "weekly" ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-black"
            }`}
          >
            خطة أسبوعية
          </button>
          <button
            id="plan-type-monthly-btn"
            onClick={() => setPlanType("monthly")}
            className={`px-4 py-2 text-xs sm:text-sm font-black rounded-lg transition-all ${
              planType === "monthly" ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-black"
            }`}
          >
            خطة شهرية دائرية
          </button>
        </div>

        {/* Generate / Manual Buttons */}
        <div className="flex items-center gap-2">
          <button
            id="add-meal-manually-trigger"
            onClick={() => setIsAddingMeal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-black font-black rounded-xl text-xs sm:text-sm border-2 border-black transition-all"
          >
            <Plus className="w-4 h-4 text-slate-600" />
            إضافة وجبة يدوياً
          </button>
          
          <button
            id="generate-ai-plan-btn"
            onClick={handleGenerateAIPlan}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-black hover:bg-neutral-800 text-white font-black rounded-xl text-xs sm:text-sm border-2 border-black transition-all shadow-md shadow-emerald-100"
          >
            <Sparkles className="w-4 h-4 animate-pulse text-emerald-200" />
            {loading ? "جاري التوليد بذكاء..." : "توليد بالذكاء الاصطناعي ✨"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 text-amber-900 border border-amber-200 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold">ملاحظة هامة من زاد الذكي:</p>
            <p className="mt-1 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Manual Meal Add Form Panel */}
      {isAddingMeal && (
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">إضافة وجبة يدوية جديدة</h3>
          <form onSubmit={handleAddMealManually} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">اليوم</label>
              <select
                id="manual-day-select"
                value={newMealDay}
                onChange={(e) => setNewMealDay(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
              >
                {daysList.map((day) => <option key={day} value={day}>{day}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">الفترة</label>
              <select
                id="manual-meal-type-select"
                value={newMealType}
                onChange={(e) => setNewMealType(e.target.value as keyof DailyMeals)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
              >
                <option value="breakfast">فطور 🍳</option>
                <option value="lunch">غداء 🥘</option>
                <option value="dinner">عشاء 🥗</option>
                <option value="snack">وجبة خفيفة 🍎</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">اسم الوجبة</label>
              <input
                id="manual-meal-name"
                type="text"
                required
                placeholder="مثال: فول بالتميس والسمن البلدي"
                value={newMealName}
                onChange={(e) => setNewMealName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">التكلفة التقديرية</label>
              <input
                id="manual-meal-cost"
                type="number"
                required
                value={newMealCost}
                onChange={(e) => setNewMealCost(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-600 mb-1">المكونات المطلوبة (مفصولة بفاصلة)</label>
              <input
                id="manual-meal-ingredients"
                type="text"
                placeholder="مثال: علبة فول مدمس، تميس، سمن، بصل، طماطم"
                value={newMealIngredients}
                onChange={(e) => setNewMealIngredients(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div className="flex items-end gap-2 justify-end">
              <button
                id="cancel-manual-meal"
                type="button"
                onClick={() => setIsAddingMeal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                id="submit-manual-meal"
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
              >
                حفظ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Meal Plan Grid Area */}
      {mealPlan ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Days Selector Rail (Horizontal or Vertical depending on screen) */}
          <div className="lg:col-span-1 space-y-1">
            <h3 className="text-sm font-bold text-slate-500 mb-2 px-1">جدول الأسبوع</h3>
            <div className="flex lg:flex-col overflow-x-auto gap-1 pb-2 lg:pb-0 scrollbar-none">
              {mealPlan.meals.map((day, index) => {
                const isActive = selectedDayIndex === index;
                // Count completed meals for this day
                const mealsObj = day.meals;
                const totalMeals = Object.keys(mealsObj).length;
                const completedCount = Object.values(mealsObj).filter(m => m.isCompleted).length;

                return (
                  <button
                    id={`day-select-${index}`}
                    key={day.dayName}
                    onClick={() => setSelectedDayIndex(index)}
                    className={`flex-shrink-0 flex lg:flex-row flex-col lg:items-center justify-between text-right p-4 rounded-xl border-2 transition-all w-28 sm:w-32 lg:w-full gap-2 ${
                      isActive
                        ? "bg-white border-emerald-500 shadow-lg shadow-emerald-50"
                        : "bg-white hover:bg-gray-50 border-gray-100"
                    }`}
                  >
                    <div>
                      <p className={`font-bold text-sm ${isActive ? "text-emerald-700" : "text-slate-800"}`}>
                        {day.dayName}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                        {completedCount} / {totalMeals} مكتمل
                      </p>
                    </div>
                    {completedCount === totalMeals && totalMeals > 0 && (
                      <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 self-end lg:self-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Actions and Sync */}
            <div className="pt-4 hidden lg:block">
              <button
                id="sync-shopping-list-btn"
                onClick={handleSyncToShopping}
                className="w-full py-3 px-4 bg-white hover:bg-gray-50 border-2 border-black text-black text-xs font-black rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <ShoppingCart className="w-4 h-4 text-black" />
                مزامنة كافة المكونات للتسوق 🛒
              </button>
            </div>
          </div>

          {/* Active Day Detail Panel */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-600" />
                    وجبات يوم {currentDayPlan?.dayName || daysList[selectedDayIndex]}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-bold">اختر وجبتك وعلم عليها عند تناولها لتتبع تقدمك المالي والغذائي.</p>
                </div>

                <div className="lg:hidden">
                  <button
                    id="sync-shopping-list-btn-mobile"
                    onClick={handleSyncToShopping}
                    className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-colors"
                    title="مزامنة مع قائمة التسوق"
                  >
                    <ShoppingCart className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Meal Periods List */}
              <div className="space-y-4">
                {currentDayPlan && Object.keys(currentDayPlan.meals).map((mealKey) => {
                  const mType = mealKey as keyof DailyMeals;
                  const meal = currentDayPlan.meals[mType];
                  const labelMap = {
                    breakfast: { label: "الفطور", emoji: "🍳", bg: "bg-amber-50 text-amber-800 border-amber-100" },
                    lunch: { label: "الغداء", emoji: "🥘", bg: "bg-blue-50 text-blue-800 border-blue-100" },
                    dinner: { label: "العشاء", emoji: "🥗", bg: "bg-purple-50 text-purple-800 border-purple-100" },
                    snack: { label: "وجبة خفيفة", emoji: "🍎", bg: "bg-emerald-50 text-emerald-800 border-emerald-100" }
                  };
                  const meta = labelMap[mType];

                  return (
                    <div
                      key={mealKey}
                      className={`p-5 rounded-xl border-2 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                        meal.isCompleted 
                          ? "bg-gray-50 border-gray-100 opacity-60" 
                          : "bg-white hover:border-gray-300 border-gray-150"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          id={`check-meal-${selectedDayIndex}-${mType}`}
                          onClick={() => handleMealCompletionToggle(selectedDayIndex, mType)}
                          className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all mt-1 flex-shrink-0 ${
                            meal.isCompleted
                              ? "bg-emerald-600 border-emerald-600 text-white"
                              : "border-slate-300 hover:border-emerald-500 bg-white"
                          }`}
                        >
                          {meal.isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
                        </button>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[11px] px-2 py-0.5 rounded-md font-bold border ${meta.bg}`}>
                              {meta.emoji} {meta.label}
                            </span>
                            <span className="text-xs text-slate-400 font-semibold">{meal.category || "متنوع"}</span>
                          </div>
                          <h4 className={`text-base font-extrabold text-slate-800 ${meal.isCompleted ? "line-through text-slate-400" : ""}`}>
                            {meal.name}
                          </h4>
                          
                          {meal.ingredients && meal.ingredients.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {meal.ingredients.map((ing, i) => (
                                <span key={i} className="text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                                  {ing}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="self-end sm:self-center text-left">
                        <span className="text-sm font-extrabold text-slate-700">
                          {meal.estimatedCost} {userProfile.currency || "SAR"}
                        </span>
                        <p className="text-[10px] text-slate-400 font-semibold">تكلفة تقديرية</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Smart AI Saving Tips Panel */}
            {mealPlan.savingTips && mealPlan.savingTips.length > 0 && (
              <div className="bg-emerald-50/75 border border-emerald-100 rounded-3xl p-5 sm:p-6 space-y-3">
                <h4 className="text-base font-extrabold text-emerald-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  نصائح زاد الذكي للتوفير المالي 💡
                </h4>
                <ul className="space-y-2 text-sm text-slate-700 list-disc list-inside">
                  {mealPlan.savingTips.map((tip, idx) => (
                    <li key={idx} className="leading-relaxed font-medium">
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-150 p-8 space-y-4 shadow-sm max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto border border-emerald-100">
            <Calendar className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800">لا توجد خطة وجبات حالية</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              ابدأ الآن بتوليد خطة طعام موفرة مخصصة بالذكاء الاصطناعي لك، أو قم بإضافة وجباتك المفضلة يدوياً للبدء بجدولة ميزانيتك.
            </p>
          </div>
          <div className="flex items-center gap-3 justify-center pt-2">
            <button
              id="empty-manual-trigger"
              onClick={() => setIsAddingMeal(true)}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors"
            >
              التخطيط اليدوي
            </button>
            <button
              id="empty-generate-ai"
              onClick={handleGenerateAIPlan}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/60 text-white font-extrabold rounded-xl text-sm shadow-md shadow-emerald-500/10 transition-colors"
            >
              {loading ? "جاري التوليد بذكاء..." : "توليد بالذكاء الاصطناعي ✨"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
