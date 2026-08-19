import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Health Check
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      shop: "Max Executive Tires",
      location: "Maranatha Square, Pichelin, Dominica",
      currency: "XCD / USD",
    });
  });

  // API Route: Gemini Tyre & Dominica Road Advisor
  app.post("/api/gemini/tyre-advisor", async (req, res) => {
    try {
      const { message, vehicleInfo, drivingHabits, tyreSize } = req.body;

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        // Fallback intelligent response if API key is not configured
        return res.json({
          reply: `Welcome to Max Executive Tires in Maranatha Square, Pichelin! 
For Dominica's steep mountain roads, wet hill climbs (like Pichelin Hill & Bellevue Chopin), and rugged terrain:
- **Recommended for Dominica**: Look for tyres with deep circumferential grooves for wet grip and reinforced sidewalls to resist pothole impacts.
- **Brand New vs Inspected Used**: If you travel daily on highway routes with heavy loads, we recommend reinforced new A/T or H/T tyres. If you want maximum value for local city/suburban driving, our Grade-A pressure-tested pre-owned tyres (80%+ tread) are fully inspected and guaranteed.
- **Fitting in Pichelin**: Come by our shop at Maranatha Square for free wheel inspection, computer balancing, and mounting!`,
          isFallback: true,
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are the Master Tyre Technician and Dominica Road Expert at "Max Executive Tires", located at Maranatha Square, Pichelin, Commonwealth of Dominica (parish of Saint Patrick).
Dominica driving conditions feature steep mountain inclines (Pichelin hill, Bellevue Chopin, Soufriere, Grand Bay), heavy tropical rains, sharp curves, and variable asphalt/concrete terrain.

Customer Query: "${message || "Advise on best tyres"}"
Vehicle Info: "${vehicleInfo || "General Passenger / SUV / 4x4"}"
Driving Habits / Terrain: "${drivingHabits || "Mountain climbs, rain, daily commute"}"
Target Tyre Size: "${tyreSize || "Not specified"}"

Provide a friendly, expert, and authoritative recommendation tailored specifically to Dominica roads and Max Executive Tires services at Maranatha Square, Pichelin.
Address:
1. Ideal tyre pattern (All-Terrain A/T, Highway Touring H/T, Reinforced Sidewall, or Commercial Load).
2. Advice on Brand New vs Grade-A Inspected Used tyre options based on safety & budget.
3. Crucial Dominica tyre maintenance advice (Recommended PSI, frequent rotation due to steep downhill cornering, wheel balancing).
4. Invite them to drive into Maranatha Square, Pichelin or WhatsApp / Call (+1 (767) 616-0155) for instant mounting and roadside assistance.
Keep the tone warm, Caribbean-friendly, knowledgeable, concise, and structured with clear bullet points. Prices in Dominica are in EC$ (XCD) and USD.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
      });

      const replyText = response.text || "Thank you for consulting Max Executive Tires. Please stop by Maranatha Square, Pichelin for a direct fitment test!";

      return res.json({
        reply: replyText,
        isFallback: false,
      });
    } catch (error: any) {
      console.error("Gemini advisor error:", error);
      return res.json({
        reply: `At Max Executive Tires in Maranatha Square, Pichelin, we recommend heavy-duty tyres with excellent wet traction and high ply ratings for Dominica's winding mountain roads. Visit our shop for precision computer balancing, mounting, or call us for rapid roadside puncture repair!`,
        isFallback: true,
      });
    }
  });

  // API Route: Quote & Booking Receiver
  app.post("/api/bookings/create", (req, res) => {
    const booking = req.body;
    const bookingId = "MET-" + Math.floor(100000 + Math.random() * 900000);
    res.json({
      success: true,
      bookingId,
      message: `Your booking at Max Executive Tires (Pichelin) has been received. Our team will prepare your tyres at Maranatha Square!`,
      details: booking,
    });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Max Executive Tires server running on http://localhost:${PORT}`);
  });
}

startServer();
