import { Request, Response } from "express";
import Groq from "groq-sdk";
import { db } from "../db";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;
function getGemini() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined under Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Initialize the Groq client lazily
let groqClient: Groq | null = null;

function getGroq() {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY environment variable is required for AI features.");
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

export const vibeSearch = async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ message: "Query is required" });
    }

    const groq = getGroq();

    // Prompt Groq to extract genres/tags
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert cinematic fashion recommender. Analyze the user query and return a list of 1 to 3 relevant movie genres or thematic tags. Possible genres/tags in our database include: Sci-Fi, Cyberpunk, Horror, Action, Thriller, Fantasy, 80s, Synthwave, Noir, Romance, Comedy, Drama, Space, Crime, Adventure, Anime, Zombies, Post-Apocalyptic, Mafia, Gangster, Historical, Magical. If the user query mentions a specific movie, identify its core genres. You must ONLY output a valid JSON object with a single key 'genres' containing an array of strings. Do not add markdown backticks."
        },
        {
          role: "user",
          content: query
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const jsonStr = chatCompletion.choices[0]?.message?.content?.trim() || "{\"genres\":[]}";
    let genres: string[] = [];
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.genres && Array.isArray(parsed.genres)) {
        genres = parsed.genres;
      }
    } catch (e) {
      console.error("Failed to parse Groq response:", jsonStr);
    }

    if (!genres || genres.length === 0) {
      return res.json([]);
    }

    // Query the database for products matching the extracted genres
    let whereClause = genres.map(() => "genres LIKE ?").join(" OR ");
    let args = genres.map(g => `%${g}%`);

    const result = await db.execute({
      sql: `SELECT * FROM products WHERE ${whereClause} LIMIT 10`,
      args,
    });

    const products = result.rows.map(row => ({
      ...row,
      genres: JSON.parse(row.genres as string || "[]"),
      images: {
        main: row.image_main,
        trailer: row.image_trailer,
      },
      inventory: {
        S: row.inventory_s,
        M: row.inventory_m,
        L: row.inventory_l,
      }
    }));

    res.json({ genres, products });
  } catch (error) {
    console.error("Vibe search error:", error);
    res.status(500).json({ message: "Failed to process vibe search" });
  }
};

export const chat = async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: "Messages array is required" });
    }

    // Fetch store context (products and collections)
    const productsResult = await db.execute("SELECT id, title, price, is_coming_soon, is_hidden, genres FROM products WHERE is_hidden = 0");
    const collectionsResult = await db.execute("SELECT id, name, category, sub_collections FROM collections");

    const productsList = productsResult.rows.map(p => {
      let genresStr = '';
      try {
        const parsed = JSON.parse(p.genres as string || "[]");
        if (parsed && parsed.length > 0) {
          genresStr = ` - Genres: ${parsed.join(', ')}`;
        }
      } catch (e) {}
      return `- [${p.title}](/product/${p.id}) (${p.price} EGP)${p.is_coming_soon ? ' [Coming Soon]' : ''}${genresStr}`;
    }).join('\n');

    const collectionsList = collectionsResult.rows.map(c => {
      let subColsInfo = '';
      try {
        const parsed = JSON.parse(c.sub_collections as string || "[]");
        if (parsed && parsed.length > 0) {
          subColsInfo = ` (Includes: ${parsed.join(', ')})`;
        }
      } catch (e) {}
      return `- [${c.name}](/shop?franchise=${encodeURIComponent(c.name as string)})${subColsInfo} - Type: ${c.category || 'أفلام'}`;
    }).join('\n');

    const systemPrompt = `You are a friendly, helpful, and cinematic AI shopping assistant for a premium apparel brand called "Director's Cut" (or "Cutscene"). 
You speak Arabic and English, matching the user's language, but default to a friendly, slightly cinematic Arabic tone (Egyptian dialect is great).

Here is the current knowledge base of the store:

Available Collections:
${collectionsList}

Available Products:
${productsList}

Interactive Visual Themes Available on the Website:
When a user searches for or views products related to these exact franchises, the website visually transforms to match their cinematic universe! The themes are:
- Fight Club, Interstellar, The Matrix, Peaky Blinders, Breaking Bad, Game of Thrones, The Godfather, The Walking Dead, Demon Slayer, Spider Man, Michael, The Punisher, Attack on Titan, Dexter, Stranger Things, La Casa De Papel.
(You can tease users about this visual transformation to make the experience more fun!)

Your Rules:
1. Be extremely helpful and polite.
2. When recommending ANY product or collection from the list, you MUST provide them as clickable Markdown links using the exact paths provided above.
   CRITICAL: For links, instead of just the product name, use actionable button text! 
   Example format: [يلا نشوف الكولكشن 🎬](/shop?franchise=Fight%20Club) or [شوف المنتج ده 🛒](/product/123)
3. If a user asks for a specific movie, character, or custom design that is NOT in the list, or if they explicitly ask for a "custom" order, you MUST tell them: "نقدر نعملك أي ديزاين كاستوم أو أي فيلم بتحبه! تواصل معانا على رسايل الإنستجرام وهنظبطلك اللي أنت عايزه 🎬✨".
4. Keep responses concise and engaging. Use cinematic emojis (🎬, 🎥, 🍿, ✨, 🗡️, 🧟).
5. Do not make up products or collections that do not exist in the list. If it's not there, direct them to Instagram custom orders.
6. Use the genre/category data to make smart recommendations! (e.g. if they want Anime, show Demon Slayer, if they want Horror/Zombies show The Walking Dead, etc.)`;

    // Map messages for Groq format (role: 'system' | 'user' | 'assistant')
    let formattedMessages: any[] = [{ role: 'system', content: systemPrompt }];
    
    for (const msg of messages) {
      let role = msg.role === 'user' ? 'user' : 'assistant';
      formattedMessages.push({ role, content: msg.content });
    }

    const groq = getGroq();

    const chatCompletion = await groq.chat.completions.create({
      messages: formattedMessages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
    });

    const reply = chatCompletion.choices[0]?.message?.content?.trim() || "عذراً، في مشكلة في الاتصال دلوقتي. جرب تاني كمان شوية! 🎬";
    res.json({ reply });
  } catch (error: any) {
    console.error("Chat error:", error);
    let errorMessage = "Failed to process chat";
    if (error.message && error.message.includes("API key not valid")) {
      errorMessage = "API key not valid";
    }
    res.status(500).json({ message: errorMessage, error: error.message, stack: error.stack });
  }
};

export const generateDescription = async (req: Request, res: Response) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title or concept is required" });
    }

    const groq = getGroq();

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a master copywriter for a premium cinematic apparel brand called "Cutscene". 
Write a compelling, SEO-friendly, and highly atmospheric product description for a premium hoodie inspired by the provided movie title or concept. 

Guidelines:
- The tone should be thrilling, immersive, and engaging, as if marketing a blockbuster movie.
- Focus on the "vibe", the aesthetic, and how wearing it makes the customer feel like the main character.
- Mention premium quality (e.g., heavyweight cotton, cinematic comfort).
- Keep it under 150 words. 
- Do not include introductory phrases like "Here is a description" or "Introducing". Start directly with the captivating copy.`
        },
        {
          role: "user",
          content: title
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
    });

    const description = chatCompletion.choices[0]?.message?.content?.trim() || "";
    res.json({ description });
  } catch (error) {
    console.error("Generate description error:", error);
    res.status(500).json({ message: "Failed to generate description" });
  }
};

// --- Social Media AI Admin ---

export const getSocialPosts = async (req: Request, res: Response) => {
  try {
    const result = await db.execute("SELECT * FROM social_posts ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (error: any) {
    console.error("Get social posts error:", error);
    res.status(500).json({ message: "Failed to fetch social posts", error: error.message });
  }
};

export const createSocialPost = async (req: Request, res: Response) => {
  try {
    const { title, platform, plan_date, caption, prompt, image_url, status } = req.body;
    if (!title || !platform) {
      return res.status(400).json({ message: "Title and platform are required" });
    }
    const id = `sp-${Date.now()}`;
    await db.execute({
      sql: `INSERT INTO social_posts (id, title, platform, plan_date, caption, prompt, image_url, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, title, platform, plan_date || "", caption || "", prompt || "", image_url || "", status || "draft"]
    });
    res.json({ success: true, id });
  } catch (error: any) {
    console.error("Create social post error:", error);
    res.status(500).json({ message: "Failed to save social post", error: error.message });
  }
};

export const updateSocialPost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, platform, plan_date, caption, prompt, image_url, status } = req.body;
    
    await db.execute({
      sql: `UPDATE social_posts 
            SET title = ?, platform = ?, plan_date = ?, caption = ?, prompt = ?, image_url = ?, status = ?
            WHERE id = ?`,
      args: [title, platform, plan_date, caption, prompt, image_url, status, id]
    });
    res.json({ success: true });
  } catch (error: any) {
    console.error("Update social post error:", error);
    res.status(500).json({ message: "Failed to update social post", error: error.message });
  }
};

export const deleteSocialPost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.execute({
      sql: "DELETE FROM social_posts WHERE id = ?",
      args: [id]
    });
    res.json({ success: true });
  } catch (error: any) {
    console.error("Delete social post error:", error);
    res.status(500).json({ message: "Failed to delete social post", error: error.message });
  }
};

export const generateSocialPlan = async (req: Request, res: Response) => {
  try {
    const { durationDays, theme, productsInfo } = req.body;
    const ai = getGemini();

    const prompt = `You are the ultimate AI Social Media Brand Manager, Copywriter, and Visual Director for "Cutscene Brand" (premium cinematic apparel store).
Generate a social media campaign strategy and day-by-day plan/calendar for a period of ${durationDays || 5} days.
Campaign Theme: ${theme || "Eid Collection Launch"}

Store products info/context for this campaign:
${productsInfo || "Custom movie hoodies and tees."}

Write highly captivating Instagram & Facebook posts in standard Egyptian Arabic dialect blended with cool cinematic English. It must be very interactive and fun. Write extreme visual detail in imageGenerationPrompt so we can use it with AI image generators.

You MUST respond ONLY with a clean, valid JSON object containing exactly the following keys, with NO backticks or extra text outside:
{
  "campaignConcept": "A short dramatic explanation of the campaign's artistic design approach and hook.",
  "recommendedHashtags": ["#CutsceneBrand", "#WearCinema"],
  "days": [
    {
      "dayNumber": 1,
      "topic": "Concept reveal / Teaser",
      "platform": "Instagram",
      "caption": "Post caption here in Egyptian Arabic + English",
      "imageGenerationPrompt": "Visual details for a cinematic graphic or photoshoot lookbook with prompt details for drawing it"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const responseText = response.text || "{}";
    const cleanText = responseText.replace(/```json/gi, "").replace(/```/gi, "").trim();
    const parsed = JSON.parse(cleanText);
    res.json(parsed);

  } catch (error: any) {
    console.error("Generate social plan error:", error);
    res.status(500).json({ 
      message: "Could not generate marketing plan. Ensure GEMINI_API_KEY is active and valid in Settings > Secrets.",
      error: error.message 
    });
  }
};

export const generateSocialImage = async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ message: "Prompt is required" });
    }

    const ai = getGemini();
    console.log("Generating social media image with prompt:", prompt);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `${prompt}. High-end commercial lookbook photography, studio cinematic lighting, cinematic framing, photorealistic, premium feel` }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    let base64Image = "";
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          base64Image = part.inlineData.data;
          break;
        }
      }
    }

    if (!base64Image) {
      throw new Error("No image data returned from image generation model.");
    }

    // Save image to files
    const filename = `social-${Date.now()}.png`;
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const filepath = path.join(uploadDir, filename);
    fs.writeFileSync(filepath, Buffer.from(base64Image, 'base64'));

    const imageUrl = `/uploads/${filename}`;
    res.json({ imageUrl });

  } catch (error: any) {
    console.error("Generate social image error:", error);
    res.status(500).json({ 
      message: "Could not generate visual mockup. Ensure GEMINI_API_KEY is active and valid in Settings > Secrets.",
      error: error.message 
    });
  }
};
