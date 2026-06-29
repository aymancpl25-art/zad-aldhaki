
cat > App.tex

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { auth, db } from "./lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import { UserProfile, MealPlan, Transaction, ShoppingItem, UserType } from "./types";

import Header from "./components/Header";
import AuthModal from "./components/AuthModal";
import MealPlanTab from "./components/MealPlanTab";
import BudgetTrackerTab from "./components/BudgetTrackerTab";
import ShoppingListTab from "./components/ShoppingListTab";
import ProfileTab from "./components/ProfileTab";

import { Sparkles, Calendar, CreditCard, ShoppingBag, ArrowLeft, Heart, Apple, CheckCircle, Smartphone, RefreshCw } from "lucide-react";

export default function App() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);

  const [activeTab, setActiveTab] = useState("meals");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        try {
          // Fetch user profile from Firestore
          const profileDoc = await getDoc(doc(db, "users", user.uid));
          if (profileDoc.exists()) {
            const profile = profileDoc.data() as UserProfile;
            setUserProfile(profile);
            await fetchUserData(user.uid);
          } else {
            // Setup default profile if none exists
            const defaultProf: UserProfile = {
              uid: user.uid,
              fullName: user.displayName || "مستخدم زاد",
              email: user.email || "",
              userType: "family",
              budgetLimit: 1200,
              currency: "SAR",
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, "users", user.uid), defaultProf);
            setUserProfile(defaultProf);
          }
        } catch (error) {
          console.error("خطأ أثناء تحميل الملف الشخصي:", error);
        }
      } else {
        // Not logged in. Check if there's a stored Demo user session in local storage
        const cachedDemo = localStorage.getItem("zad_demo_profile");
        if (cachedDemo) {
          setUserProfile(JSON.parse(cachedDemo));
          loadDemoData();
        } else {
          setUserProfile(null);
          setMealPlan(null);
          setTransactions([]);
          setShoppingItems([]);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Fetch specific user data from Firestore
  const fetchUserData = async (uid: string) => {
    try {
      // Fetch latest meal plan
      const mealDocs = await getDocs(collection(db, "users", uid, "mealPlans"));
      if (!mealDocs.empty) {
        // Get the most recent one
        const plans = mealDocs.docs.map(doc => doc.data() as MealPlan);
        plans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setMealPlan(plans[0]);
      } else {
        setMealPlan(null);
      }

      // Fetch transactions
      const txDocs = await getDocs(collection(db, "users", uid, "transactions"));
      const txs = txDocs.docs.map(doc => doc.data() as Transaction);
      txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(txs);

      // Fetch shopping list
      const shopDocs = await getDocs(collection(db, "users", uid, "shoppingLists"));
      if (!shopDocs.empty) {
        const list = shopDocs.docs[0].data() as { items: ShoppingItem[] };
        setShoppingItems(list.items || []);
      } else {
        setShoppingItems([]);
      }
    } catch (err) {
      console.error("خطأ أثناء استعلام بيانات المستخدم من فيربيز:", err);
    }
  };

  // 3. Demo Data Fallback loading
  const loadDemoData = () => {
    const cachedPlan = localStorage.getItem("zad_demo_mealPlan");
    const cachedTxs = localStorage.getItem("zad_demo_transactions");
    const cachedShop = localStorage.getItem("zad_demo_shopping");

    if (cachedPlan) setMealPlan(JSON.parse(cachedPlan));
    if (cachedTxs) setTransactions(JSON.parse(cachedTxs));
    if (cachedShop) setShoppingItems(JSON.parse(cachedShop));
  };

  // 4. Save updates back to database or local storage
  const handleUpdateProfile = async (updated: UserProfile) => {
    setUserProfile(updated);
    if (updated.uid === "demo-user-123") {
      localStorage.setItem("zad_demo_profile", JSON.stringify(updated));
    } else {
      await setDoc(doc(db, "users", updated.uid), updated);
    }
  };

  const handleUpdateMealPlan = async (newPlan: MealPlan) => {
    setMealPlan(newPlan);
    if (userProfile?.uid === "demo-user-123") {
      localStorage.setItem("zad_demo_mealPlan", JSON.stringify(newPlan));
    } else if (userProfile) {
      await setDoc(doc(db, "users", userProfile.uid, "mealPlans", newPlan.id), newPlan);
    }
  };

  const handleAddTransaction = async (tx: Transaction) => {
    const updated = [tx, ...transactions];
    setTransactions(updated);
    if (userProfile?.uid === "demo-user-123") {
      localStorage.setItem("zad_demo_transactions", JSON.stringify(updated));
    } else if (userProfile) {
      await setDoc(doc(db, "users", userProfile.uid, "transactions", tx.id), tx);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    if (userProfile?.uid === "demo-user-123") {
      localStorage.setItem("zad_demo_transactions", JSON.stringify(updated));
    } else if (userProfile) {
      await deleteDoc(doc(db, "users", userProfile.uid, "transactions", id));
    }
  };

  const handleAddShoppingItem = async (item: ShoppingItem) => {
    const updated = [item, ...shoppingItems];
    setShoppingItems(updated);
    saveShoppingItems(updated);
  };

  const handleToggleShoppingItem = async (id: string) => {
    const updated = shoppingItems.map(item =>
      item.id === id ? { ...item, isBought: !item.isBought } : item
    );
    setShoppingItems(updated);
    saveShoppingItems(updated);
  };

  const handleDeleteShoppingItem = async (id: string) => {
    const updated = shoppingItems.filter(item => item.id !== id);
    setShoppingItems(updated);
    saveShoppingItems(updated);
  };

  const handleClearBoughtItems = async () => {
    const updated = shoppingItems.filter(item => !item.isBought);
    setShoppingItems(updated);
    saveShoppingItems(updated);
  };

  const handleAddAllToShoppingList = async (items: { name: string; category: string; quantity: string }[]) => {
    // Map items correctly
    const newItems: ShoppingItem[] = items.map((item, idx) => ({
      id: "shop-sync-" + idx + "-" + Date.now(),
      name: item.name,
      quantity: item.quantity,
      category: item.category.includes("خضار") || item.category.includes("فواكه") ? "خضار وفواكه 🥦" :
                item.category.includes("لحوم") || item.category.includes("أسماك") || item.category.includes("بروتين") ? "لحوم وأسماك 🥩" :
                item.category.includes("ألبان") || item.category.includes("أجبان") ? "ألبان وأجبان 🧀" : "بهارات ومستلزمات عامة 🧂",
      isBought: false
    }));

    const updated = [...newItems, ...shoppingItems];
    setShoppingItems(updated);
    saveShoppingItems(updated);
  };

  const saveShoppingItems = async (items: ShoppingItem[]) => {
    if (userProfile?.uid === "demo-user-123") {
      localStorage.setItem("zad_demo_shopping", JSON.stringify(items));
    } else if (userProfile) {
      await setDoc(doc(db, "users", userProfile.uid, "shoppingLists", "default"), {
        id: "default",
        userId: userProfile.uid,
        items,
        updatedAt: new Date().toISOString()
      });
    }
  };

  const handleAuthSuccess = (profile: UserProfile) => {
    setUserProfile(profile);
    if (profile.uid === "demo-user-123") {
      localStorage.setItem("zad_demo_profile", JSON.stringify(profile));
      loadDemoData();
    } else {
      localStorage.removeItem("zad_demo_profile");
      localStorage.removeItem("zad_demo_mealPlan");
      localStorage.removeItem("zad_demo_transactions");
      localStorage.removeItem("zad_demo_shopping");
      fetchUserData(profile.uid);
    }
  };

  const handleLogout = async () => {
    if (userProfile?.uid === "demo-user-123") {
      localStorage.clear();
      setUserProfile(null);
      setMealPlan(null);
      setTransactions([]);
      setShoppingItems([]);
    } else {
      await signOut(auth);
    }
  };

  const handleStartDemo = () => {
    const demoProfile: UserProfile = {
      uid: "demo-user-123",
      fullName: "عائلة أحمد التجريبية",
      email: " أحمد@مثال.كوم",
      userType: "family",
      budgetLimit: 1500,
      currency: "SAR",
      familyCount: 4,
      preferences: "أكلات سعودية شعبية، ومأكولات صحية قليلة الدهون للاستخدام اليومي الموفر.",
      createdAt: new Date().toISOString()
    };
    handleAuthSuccess(demoProfile);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#FCFCFC] font-sans text-[#1A1A1A] selection:bg-emerald-100 selection:text-emerald-800">
      <Header
        userProfile={userProfile}
        onLoginClick={() => setIsAuthModalOpen(true)}
        onLogoutClick={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Workspace Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
            <p className="text-sm font-black text-slate-500">جاري تحميل منصة زاد الذكي...</p>
          </div>
        ) : userProfile ? (
          /* Active Logged In Dashboard Container */
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              {activeTab === "meals" && (
                <MealPlanTab
                  userProfile={userProfile}
                  mealPlan={mealPlan}
                  onUpdateMealPlan={handleUpdateMealPlan}
                  onAddAllToShoppingList={handleAddAllToShoppingList}
                />
              )}
              {activeTab === "budget" && (
                <BudgetTrackerTab
                  userProfile={userProfile}
                  transactions={transactions}
                  onAddTransaction={handleAddTransaction}
                  onDeleteTransaction={handleDeleteTransaction}
                />
              )}
              {activeTab === "shopping" && (
                <ShoppingListTab
                  userProfile={userProfile}
                  shoppingItems={shoppingItems}
                  onAddItem={handleAddShoppingItem}
                  onToggleItem={handleToggleShoppingItem}
                  onDeleteItem={handleDeleteShoppingItem}
                  onClearBoughtItems={handleClearBoughtItems}
                />
              )}
              {activeTab === "profile" && (
                <ProfileTab
                  userProfile={userProfile}
                  onUpdateProfile={handleUpdateProfile}
                />
              )}
            </motion.div>
          </AnimatePresence>
        ) : (
          /* Unauthenticated Beautiful Hero Landing Page */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-16"
          >
            {/* Hero Main Banner */}
            <div className="text-center space-y-8 max-w-4xl mx-auto py-12">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs sm:text-sm font-black border border-emerald-100 uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                تخطيط ذكي بنسبة ١٠٠٪ يوفر ميزانيتك
              </span>
              
              <h1 className="text-5xl sm:text-7xl font-black text-black leading-none tracking-tighter">
                خطط وجباتك، راقب ميزانيتك ووفر <span className="text-emerald-600 underline decoration-wavy decoration-emerald-500/30">مقاضيك اليومية.</span>
              </h1>
              
              <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed font-bold">
                زاد الذكي هو رفيقك المالي والغذائي للتخطيط الأسبوعي والشهري المتكامل، المخصص للعائلات والموظفين والطلاب لتناول طعام صحي بأوفر كلفة!
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <button
                  id="landing-demo-btn"
                  onClick={handleStartDemo}
                  className="w-full sm:w-auto px-8 py-4 bg-black hover:bg-neutral-800 text-white font-black rounded-xl text-sm transition-all border-2 border-black"
                >
                  جرب كضيف مجاناً (بدون حساب) 🚀
                </button>
                <button
                  id="landing-login-btn"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-gray-50 text-black font-black rounded-xl text-sm border-2 border-black transition-all"
                >
                  دخول / إنشاء حساب جديد
                </button>
              </div>
            </div>

            {/* Feature Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-2xl border-2 border-gray-100 flex flex-col gap-4 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center text-emerald-600">
                  <Calendar className="w-6 h-6" />
                </div>
                <span className="text-xs font-black text-emerald-600 uppercase tracking-wider">خطة ذكية</span>
                <h3 className="text-xl sm:text-2xl font-black text-black leading-none tracking-tight">تخطيط وجبات مرن</h3>
                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed font-bold">
                  احصل على خطة وجبات أسبوعية أو شهرية ذكية مخصصة بالكامل بالذكاء الاصطناعي لتلائم طعم عائلتك وميزانيتكم المحددة.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl border-2 border-gray-100 flex flex-col gap-4 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-teal-50 border-2 border-teal-100 flex items-center justify-center text-teal-600">
                  <CreditCard className="w-6 h-6" />
                </div>
                <span className="text-xs font-black text-teal-600 uppercase tracking-wider">مراقب الميزانية</span>
                <h3 className="text-xl sm:text-2xl font-black text-black leading-none tracking-tight">مراقب ميزانية ذكي</h3>
                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed font-bold">
                  تتبع مصروفات طعامك، فواتير بقالتك والمطاعم لتبقى دوماً تحت السيطرة وتوفر مبالغ كبيرة للفترات القادمة.
                </p>
              </div>

              <div className="bg-white p-8 rounded-2xl border-2 border-gray-100 flex flex-col gap-4 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-amber-50 border-2 border-amber-100 flex items-center justify-center text-amber-600">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <span className="text-xs font-black text-amber-600 uppercase tracking-wider">قائمة تسوق ذكية</span>
                <h3 className="text-xl sm:text-2xl font-black text-black leading-none tracking-tight">قائمة تسوق سريعة</h3>
                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed font-bold">
                  قم بمزامنة مكونات خطة وجباتك مباشرة لقائمة التسوق المصنفة لمساعدتك في جولة تسوق سريعة وشارعها عبر الواتساب.
                </p>
              </div>
            </div>

            {/* Testimonial / Social Section */}
            <div className="bg-emerald-950 text-white rounded-[32px] p-8 sm:p-12 border-2 border-emerald-900 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
              <div className="space-y-4 max-w-lg z-10">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-500/15 uppercase tracking-wider">
                  تجارب حقيقية ★★★★★
                </span>
                <h3 className="text-2xl sm:text-3xl font-black leading-snug tracking-tight">«ساعدني زاد في تقليل فواتير طعام عائلتي للنصف تماماً وبسهولة تامة!»</h3>
                <p className="text-xs text-emerald-300 font-bold">— أم سارة، مشرفة منزل وعائلة مكونة من ٥ أفراد</p>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full md:w-auto z-10">
                <div className="bg-emerald-900/60 backdrop-blur-sm p-6 rounded-2xl border-2 border-emerald-800 text-center">
                  <span className="block text-2xl sm:text-3xl font-black text-emerald-400">٩٥٪</span>
                  <span className="text-[10px] sm:text-xs text-emerald-200 font-black uppercase tracking-wider">دقة تخطيط وجبات</span>
                </div>
                <div className="bg-emerald-900/60 backdrop-blur-sm p-6 rounded-2xl border-2 border-emerald-800 text-center">
                  <span className="block text-2xl sm:text-3xl font-black text-emerald-400">٣٠٠+</span>
                  <span className="text-[10px] sm:text-xs text-emerald-200 font-black uppercase tracking-wider">ريال توفير شهري تقديري</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 py-8 bg-white/60 text-center text-xs text-slate-400 font-medium">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="flex items-center gap-1.5 justify-center">
            صنع بحب وشغف ومستند على الذكاء الاصطناعي لزاد الذكي
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          </p>
          <p className="ltr" dir="ltr">© 2026 Zad Smart Meal Planner SaaS. All rights reserved.</p>
        </div>
      </footer>

      {/* Auth Modal overlay registration */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
