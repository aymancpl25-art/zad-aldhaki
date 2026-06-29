import React, { useState } from "react";
import { UserProfile, ShoppingItem } from "../types";
import { Plus, Check, Trash2, ShoppingBag, Copy, CheckSquare, RefreshCw, Sparkles } from "lucide-react";

interface ShoppingListTabProps {
  userProfile: UserProfile;
  shoppingItems: ShoppingItem[];
  onAddItem: (item: ShoppingItem) => void;
  onToggleItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onClearBoughtItems: () => void;
}

export default function ShoppingListTab({
  userProfile,
  shoppingItems,
  onAddItem,
  onToggleItem,
  onDeleteItem,
  onClearBoughtItems
}: ShoppingListTabProps) {
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [category, setCategory] = useState("خضار وفواكه 🥦");

  const categories = [
    "خضار وفواكه 🥦",
    "لحوم وأسماك 🥩",
    "ألبان وأجبان 🧀",
    "معلبات ومجمدات 🥫",
    "مخبوزات وحلويات 🍞",
    "بهارات ومستلزمات عامة 🧂"
  ];

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    const newItem: ShoppingItem = {
      id: "shop-" + Date.now(),
      name: itemName.trim(),
      quantity: quantity.trim() || "1",
      category,
      isBought: false
    };

    onAddItem(newItem);
    setItemName("");
    setQuantity("1");
  };

  // Group items by category
  const groupedItems = shoppingItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  // Copy shopping list to clipboard in elegant Arabic text
  const handleCopyToClipboard = () => {
    if (shoppingItems.length === 0) return;

    let text = `🛒 *قائمة التسوق الذكية من تطبيق زاد الذكي* 🛒\n\n`;
    Object.keys(groupedItems).forEach((cat) => {
      text += `*🔹 ${cat}*:\n`;
      groupedItems[cat].forEach((item) => {
        text += `  ${item.isBought ? "[✓]" : "[ ]"} ${item.name} (${item.quantity})\n`;
      });
      text += `\n`;
    });
    text += `تم التخطيط بذكاء ومحبة باستخدام منصة زاد الذكي. 💚`;

    navigator.clipboard.writeText(text);
    alert("تم نسخ قائمة المشتريات بصيغة ممتازة! يمكنك الآن لصقها في الواتساب ومشاركتها مع عائلتك أو أصدقائك. 📲");
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Intro visual header */}
      <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-xl font-black text-black flex items-center gap-2">
            <ShoppingBag className="w-5.5 h-5.5 text-emerald-600" />
            قائمة المشتريات التشاركية
          </h3>
          <p className="text-xs text-gray-400 font-bold">خطط مشترياتك بدقة، تصنيفات زاد ترتب المقاضي لتسريع جولة السوبرماركت والتوفير!</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            id="clear-bought-btn"
            onClick={onClearBoughtItems}
            disabled={shoppingItems.filter(i => i.isBought).length === 0}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-white hover:bg-rose-50 text-gray-500 hover:text-rose-600 text-xs font-black border-2 border-gray-200 rounded-xl transition-all disabled:opacity-50"
          >
            مسح المكتمل
          </button>
          
          <button
            id="copy-shopping-list-btn"
            onClick={handleCopyToClipboard}
            disabled={shoppingItems.length === 0}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-black rounded-xl border-2 border-black transition-all disabled:opacity-50"
          >
            <Copy className="w-4 h-4 text-emerald-200" />
            مشاركة عبر واتساب 📲
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Add manually */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm h-fit">
          <h3 className="text-lg font-black text-black mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-600" />
            إضافة صنف مالي يدوياً
          </h3>

          <form onSubmit={handleAddItem} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">اسم الغرض</label>
              <input
                id="shop-item-name"
                type="text"
                required
                placeholder="مثال: حليب المراعي كامل الدسم"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-bold focus:outline-none focus:border-black transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">الكمية</label>
                <input
                  id="shop-item-qty"
                  type="text"
                  required
                  placeholder="مثال: 3 حبات، 1 كجم"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-bold focus:outline-none focus:border-black transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">التصنيف</label>
                <select
                  id="shop-item-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 text-xs font-black focus:outline-none focus:border-black"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              id="add-shop-item-btn"
              type="submit"
              className="w-full py-3.5 px-4 bg-black hover:bg-neutral-800 text-white font-black rounded-xl text-sm transition-all border-2 border-black flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              إضافة صنف للجدول
            </button>
          </form>
        </div>

        {/* Right column: Categorized items ledger */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-black text-black border-b border-gray-100 pb-4 mb-4">أغراض الطهي والتسوق</h3>

            {shoppingItems.length === 0 ? (
              <div className="text-center py-16 text-gray-400 space-y-3">
                <CheckSquare className="w-12 h-12 text-gray-250 mx-auto" />
                <p className="text-sm font-black text-black">سلتك فارغة تماماً من المقاضي</p>
                <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed font-bold">
                  يمكنك إضافة الاحتياجات يدوياً، أو التوجه لـ <span className="font-black underline text-emerald-600">خطة الوجبات</span> ومزامنة مكونات الوجبات بكبسة زر واحدة!
                </p>
              </div>
            ) : (
              <div className="space-y-6 max-h-[460px] overflow-y-auto pr-1">
                {Object.keys(groupedItems).map((catName) => (
                  <div key={catName} className="space-y-2">
                    <h4 className="text-[10px] font-black text-black bg-gray-100 border border-gray-200 px-2.5 py-1 rounded uppercase tracking-wider w-fit">
                      {catName}
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {groupedItems[catName].map((item) => (
                        <div
                          key={item.id}
                          className={`p-4 rounded-xl border-2 transition-all flex items-center justify-between gap-3 ${
                            item.isBought
                              ? "bg-emerald-50/20 border-emerald-100 opacity-60"
                              : "bg-white hover:border-gray-300 border-gray-100"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <button
                              id={`check-shop-item-${item.id}`}
                              onClick={() => onToggleItem(item.id)}
                              className={`w-5 h-5 rounded border flex items-center justify-center transition-all flex-shrink-0 ${
                                item.isBought
                                  ? "bg-emerald-600 border-emerald-600 text-white"
                                  : "border-slate-300 hover:border-emerald-500 bg-white"
                              }`}
                            >
                              {item.isBought && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </button>

                            <div className="text-right overflow-hidden">
                              <p className={`text-sm font-bold text-slate-800 truncate ${item.isBought ? "line-through text-slate-400" : ""}`}>
                                {item.name}
                              </p>
                              <p className="text-[10px] text-slate-400 font-bold">الكمية: {item.quantity}</p>
                            </div>
                          </div>

                          <button
                            id={`delete-shop-item-${item.id}`}
                            onClick={() => onDeleteItem(item.id)}
                            className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition-colors flex-shrink-0"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {shoppingItems.length > 0 && (
            <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>مجموع مقاضي السلة: {shoppingItems.length} غرض</span>
              <span className="text-emerald-600 font-bold">
                تم شراء {shoppingItems.filter((i) => i.isBought).length} غرض
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
