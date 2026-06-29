import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middlewares
  app.use(express.json());

  // API Route: Generate Smart Meal Plan using Gemini
  app.post("/api/generate-meal-plan", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: "يرجى تكوين مفتاح API لـ Gemini في إعدادات التطبيق (GEMINI_API_KEY).",
          code: "MISSING_API_KEY"
        });
      }

      const { userType, budgetLimit, currency, planType, preferences, familyCount } = req.body;

      // Lazy initialization of GoogleGenAI
      const ai = new GoogleGenAI({ apiKey });

      // Construct a professional prompt in Arabic
      const prompt = `
        قم بإنشاء خطة وجبات ذكية واقتصادية باللغة العربية تناسب المعايير التالية:
        - نوع المستخدم: ${userType === "family" ? `عائلة (عدد الأفراد: ${familyCount || 4})` : userType === "employee" ? "موظف" : "طالب"}
        - الميزانية المحددة لطعام الفترة: ${budgetLimit} ${currency || "ريال سعودي"}
        - مدة خطة الوجبات: خطة ${planType === "weekly" ? "أسبوعية (7 أيام)" : "شهرية (سنكتفي بإنشاء 7 أيام كعينة أسبوعية مميزة للشهر كله لتوفير الاستهلاك)"}
        - تفضيلات إضافية: ${preferences || "لا توجد تفضيلات خاصة، يفضل طعام منوع وصحي وموفر"}

        التعليمات:
        1. يجب أن تكون الوجبات واقعية ولذيذة ومغذية، وتعتمد على مكونات اقتصادية شائعة في المطبخ العربي.
        2. التكلفة التقديرية لكل الوجبات يجب أن تتناسب مع الميزانية الإجمالية (${budgetLimit} ${currency}).
        3. يرجى توفير مكونات دقيقة وموجزة لكل وجبة لكي تضاف تلقائياً لقائمة التسوق الذكية.
        4. يرجى صياغة 3 نصائح للتوفير الذكي والتسوق بذكاء مخصصة للفئة المستخدمة (${userType === "family" ? "العائلات" : userType === "employee" ? "الموظفين" : "الطلاب"}).
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "أنت خبير تغذية وتخطيط وجبات ذكي واقتصادي عربي. تساعد العائلات والموظفين والطلاب في تخطيط طعامهم بأعلى جودة وأقل تكلفة ممكنة وتلتزم بصيغة JSON المحددة بدقة.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              days: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    dayName: { type: Type.STRING, description: "اسم اليوم باللغة العربية (مثل السبت، الأحد)" },
                    meals: {
                      type: Type.OBJECT,
                      properties: {
                        breakfast: {
                          type: Type.OBJECT,
                          properties: {
                            name: { type: Type.STRING, description: "اسم وجبة الفطور" },
                            category: { type: Type.STRING, description: "تصنيف الوجبة (مثل: بروتين، كربوهيدرات، إلخ)" },
                            estimatedCost: { type: Type.NUMBER, description: "التكلفة التقديرية لهذه الوجبة" },
                            ingredients: { type: Type.ARRAY, items: { type: Type.STRING }, description: "المكونات الأساسية" }
                          },
                          required: ["name", "category", "estimatedCost", "ingredients"]
                        },
                        lunch: {
                          type: Type.OBJECT,
                          properties: {
                            name: { type: Type.STRING, description: "اسم وجبة الغداء" },
                            category: { type: Type.STRING, description: "تصنيف الوجبة" },
                            estimatedCost: { type: Type.NUMBER, description: "التكلفة التقديرية" },
                            ingredients: { type: Type.ARRAY, items: { type: Type.STRING }, description: "المكونات الأساسية" }
                          },
                          required: ["name", "category", "estimatedCost", "ingredients"]
                        },
                        dinner: {
                          type: Type.OBJECT,
                          properties: {
                            name: { type: Type.STRING, description: "اسم وجبة العشاء" },
                            category: { type: Type.STRING, description: "تصنيف الوجبة" },
                            estimatedCost: { type: Type.NUMBER, description: "التكلفة التقديرية" },
                            ingredients: { type: Type.ARRAY, items: { type: Type.STRING }, description: "المكونات الأساسية" }
                          },
                          required: ["name", "category", "estimatedCost", "ingredients"]
                        },
                        snack: {
                          type: Type.OBJECT,
                          properties: {
                            name: { type: Type.STRING, description: "وجبة خفيفة" },
                            category: { type: Type.STRING, description: "تصنيف الوجبة" },
                            estimatedCost: { type: Type.NUMBER, description: "التكلفة التقديرية" },
                            ingredients: { type: Type.ARRAY, items: { type: Type.STRING }, description: "المكونات الأساسية" }
                          },
                          required: ["name", "category", "estimatedCost", "ingredients"]
                        }
                      },
                      required: ["breakfast", "lunch", "dinner", "snack"]
                    }
                  },
                  required: ["dayName", "meals"]
                }
              },
              totalEstimatedCost: { type: Type.NUMBER, description: "التكلفة الإجمالية التقديرية للخطة كاملة" },
              savingTips: { type: Type.ARRAY, items: { type: Type.STRING }, description: "نصائح ذكية للتوفير والتسوق" }
            },
            required: ["days", "totalEstimatedCost", "savingTips"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("لم يتم إرجاع أي استجابة من نموذج الذكاء الاصطناعي.");
      }

      const planData = JSON.parse(responseText.trim());
      return res.json(planData);
    } catch (error: any) {
      console.error("خطأ أثناء توليد خطة الوجبات:", error);
      return res.status(500).json({
        error: "فشل توليد خطة الوجبات. يرجى المحاولة لاحقاً.",
        details: error.message || error
      });
    }
  });

  // Serve static frontend assets
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

startServer();
