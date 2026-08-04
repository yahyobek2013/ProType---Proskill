import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { WebSocketServer, WebSocket } from 'ws';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Media directory storage setup
const MEDIA_DIR = path.join(process.cwd(), 'media');
const AVATARS_DIR = path.join(MEDIA_DIR, 'avatars');
if (!fs.existsSync(AVATARS_DIR)) {
  fs.mkdirSync(AVATARS_DIR, { recursive: true });
}
app.use('/media', express.static(MEDIA_DIR));

// Database storage setup
const DB_FILE = path.join(process.cwd(), 'db.json');

// Initialize Gemini SDK lazily if key is provided
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY sozlanmagan");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

interface DBData {
  users: Array<{
    id: string;
    login: string;
    ism: string;
    familiya: string;
    password: string;
    avatar?: string;
    role: 'user' | 'admin';
    created_at: string;
    wpm_max: number;
    accuracy_avg: number;
    tests_completed: number;
    badges: string[];
    total_words_typed: number;
    rating?: number;
  }>;
  competitions: Array<{
    id: string;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    status: 'active' | 'upcoming' | 'finished';
    text: string;
    duration: number; // 15, 30, 60, 120, 300
    selected_text_ids?: string[];
    texts_pool?: Array<{
      id: string;
      title: string;
      content: string;
      category?: string;
      language?: string;
    }>;
    reward_points: number;
    certificate_policy?: 'none' | 'winner_only' | 'top_3' | 'all_participants';
    participants: Array<{
      user_id: string;
      user_name: string;
      avatar?: string;
      wpm: number;
      net_wpm?: number;
      accuracy: number;
      cpm?: number;
      errors?: number;
      correct_chars?: number;
      incorrect_chars?: number;
      total_chars_typed?: number;
      total_words_typed?: number;
      completed_percentage?: number;
      completion_time?: number;
      duration?: number;
      remaining_time?: number;
      rating_points?: number;
      total_participants?: number;
      speed_history?: Array<{ second: number; wpm: number; netWpm: number; accuracy: number }>;
      mistake_keyboard_heatmap?: Record<string, number>;
      mistake_details?: Array<{ expectedChar: string; typedChar: string; count: number; percentage: number }>;
      score: number;
      rank?: number;
      joined_at: string;
    }>;
    created_by?: string;
  }>;
  results: Array<{
    id: string;
    user_id: string;
    user_name: string;
    wpm: number;
    cpm: number;
    accuracy: number;
    errors: number;
    test_type: 'practice' | 'battle' | 'test' | 'code' | 'competition';
    date: string;
    text_title?: string;
  }>;
  texts: Array<{
    id: string;
    title: string;
    content: string;
    category: string;
    language: 'uz' | 'en' | 'ru';
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }>;
  certificates?: Array<{
    id: string;
    user_id: string;
    user_name: string;
    login: string;
    user_avatar?: string;
    wpm: number;
    net_wpm: number;
    accuracy: number;
    test_type: string;
    date: string;
    created_at: string;
  }>;
}


const defaultDB: DBData = {
  users: [
    {
      id: 'admin_1',
      login: 'yy',
      ism: 'Yahyobek',
      familiya: 'Yaqubboyev',
      password: 'yy',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      role: 'admin',
      created_at: new Date().toISOString(),
      wpm_max: 118,
      accuracy_avg: 99.2,
      tests_completed: 142,
      badges: ['Master Typist', 'Tizim Administratori', 'Chempion', 'Tezkor Barmoqlar'],
      total_words_typed: 18500,
    },
    {
      id: 'user_2',
      login: 'alisher',
      ism: 'Alisher',
      familiya: 'Navoiy',
      password: '123',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
      role: 'user',
      created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
      wpm_max: 95,
      accuracy_avg: 98.4,
      tests_completed: 88,
      badges: ['Master Typist', 'Adabiyot Ashaddiyi'],
      total_words_typed: 12400,
    },
    {
      id: 'user_3',
      login: 'dilnoza',
      ism: 'Dilnoza',
      familiya: 'Karimova',
      password: '123',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
      role: 'user',
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      wpm_max: 88,
      accuracy_avg: 97.8,
      tests_completed: 64,
      badges: ['Kodni Sevadiganlar', 'Klaviatura Ustasi'],
      total_words_typed: 8900,
    },
    {
      id: 'user_4',
      login: 'jasur',
      ism: 'Jasur',
      familiya: 'Sobirov',
      password: '123',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
      role: 'user',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      wpm_max: 76,
      accuracy_avg: 96.1,
      tests_completed: 35,
      badges: ['Yangi Boshlovchi'],
      total_words_typed: 4200,
    }
  ],
  competitions: [
    {
      id: 'comp_1',
      title: "Respublika Tezkor Yozuv Musobaqasi - 2026",
      description: "O'zbekiston bo'ylab eng tez va aniq yozadigan mutaxassislarni aniqlash musobaqasi. Barcha qatnashchilarga sertifikat beriladi!",
      start_time: new Date(Date.now() - 86400000).toISOString(),
      end_time: new Date(Date.now() + 86400000 * 5).toISOString(),
      status: 'active',
      text: "O'zbekiston kelajagi buyuk davlatdir. Yoshlarimiz zamonaviy texnologiyalarni puxta egallab, dunyo sahnasida o'z o'rnini topmoqda. Bilim va mehnatsevarlik kelajak poydevoridir.",
      duration: 60,
      selected_text_ids: ['txt_1'],
      texts_pool: [
        {
          id: 'txt_1',
          title: "Vatan va Taraqqiyot",
          content: "O'zbekiston kelajagi buyuk davlatdir. Yoshlarimiz zamonaviy texnologiyalarni puxta egallab, dunyo sahnasida o'z o'rnini topmoqda. Bilim va mehnatsevarlik kelajak poydevoridir.",
          category: 'mashq',
          language: 'uz'
        }
      ],
      reward_points: 500,
      participants: [
        {
          user_id: 'admin_1',
          user_name: 'Yahyobek Yaqubboyev',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
          wpm: 114,
          accuracy: 99.5,
          score: 567,
          joined_at: new Date(Date.now() - 3600000 * 4).toISOString()
        },
        {
          user_id: 'user_2',
          user_name: 'Alisher Navoiy',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
          wpm: 94,
          accuracy: 98.1,
          score: 461,
          joined_at: new Date(Date.now() - 3600000 * 2).toISOString()
        }
      ],
      created_by: 'Yahyobek Yaqubboyev'
    },
    {
      id: 'comp_2',
      title: "Sun'iy Intellekt va Kod Yozish Sprinti",
      description: "Dasturchilar va IT mutaxassislari uchun tezkor kod terish musobaqasi.",
      start_time: new Date(Date.now() - 86400000 * 10).toISOString(),
      end_time: new Date(Date.now() - 86400000 * 1).toISOString(),
      status: 'finished',
      text: "const calculateSpeed = (words, timeInSeconds) => Math.round((words / timeInSeconds) * 60);",
      duration: 30,
      selected_text_ids: ['txt_4'],
      texts_pool: [
        {
          id: 'txt_4',
          title: "JavaScript Speed Calculation",
          content: "const calculateSpeed = (words, timeInSeconds) => Math.round((words / timeInSeconds) * 60);",
          category: 'kod',
          language: 'en'
        }
      ],
      reward_points: 350,
      participants: [
        {
          user_id: 'user_3',
          user_name: 'Dilnoza Karimova',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
          wpm: 88,
          accuracy: 99.0,
          score: 435,
          joined_at: new Date(Date.now() - 86400000 * 2).toISOString()
        }
      ],
      created_by: 'Yahyobek Yaqubboyev'
    }
  ],
  results: [
    {
      id: 'res_1',
      user_id: 'admin_1',
      user_name: 'Yahyobek Yaqubboyev',
      wpm: 118,
      cpm: 590,
      accuracy: 99.2,
      errors: 1,
      test_type: 'test',
      date: new Date(Date.now() - 3600000 * 12).toISOString(),
      text_title: 'Sertifikat Imtihoni'
    },
    {
      id: 'res_2',
      user_id: 'user_2',
      user_name: 'Alisher Navoiy',
      wpm: 95,
      cpm: 475,
      accuracy: 98.4,
      errors: 3,
      test_type: 'practice',
      date: new Date(Date.now() - 3600000 * 24).toISOString(),
      text_title: 'Mavlono Navoiy Hikmatlari'
    }
  ],
  texts: [
    {
      id: 'txt_1',
      title: 'Dasturlash va Mantiqiy Fikrlash',
      content: "Dasturlash – bu muammolarni mantiqiy fikrlash va tizimli yondashuv orqali hal qilish san'atidir. Har bir yozilgan kod qatori kelajak texnologiyalarining tamal toshidir. Klaviatura bilan tez va aniq ishlash har bir dasturchining unumdorligini oshiradi.",
      category: 'mashq',
      language: 'uz',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'txt_2',
      title: 'Buyuk Allomalar Yurti',
      content: "O'zbekiston – buyuk allomalar yurti. Al-Xorazmiy, Ibn Sino, Al-Beruniy va Mirzo Ulug'bek kabi bobolarimiz dunyo ilm-faniga beqiyos hissa qo'shganlar. Zamonaviy yoshlarimiz bu an'anani IT va texnologiya sohasida munosib davom ettirmoqda.",
      category: 'mashq',
      language: 'uz',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'txt_3',
      title: 'Typing Practice & Speed',
      content: "Speed and accuracy in typing are crucial skills for developers, writers, and digital professionals. Daily practice with structured exercises helps build muscle memory and reduces cognitive load while coding or writing.",
      category: 'mashq',
      language: 'en',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'txt_4',
      title: 'Скорость и Навык Печати',
      content: "Скорость и точность печати — ключевые навыки для программистов и специалистов IT. Ежедневные тренировки развивают мышечную память и существенно повышают общую производительность при работе за компьютером.",
      category: 'mashq',
      language: 'ru',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'txt_5',
      title: '1 Daqiqalik Tezlik Testi',
      content: "Klaviatura tezligi testi 1 daqiqa davomida aniqligingiz va daqiqasiga nechtagacha so'z yoza olishingizni baholaydi. Har bir xatosiz yozilgan belgi reytingingizni oshirishga va rasmiy ProType sertifikatiga yaqinlashtirishga xizmat qiladi.",
      category: 'test',
      language: 'uz',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'txt_6',
      title: 'One Minute Typing Speed Evaluation',
      content: "The typing speed test evaluates your WPM and accuracy over a one-minute duration. Focus on precision to maintain a high accuracy score while gradually increasing your word count per minute.",
      category: 'test',
      language: 'en',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'txt_7',
      title: 'Tezkor Poyga va Arena Janggi',
      content: "Shiddatli marraga chorlovchi tezkor poyga boshlandi! Diqqatingizni jamlang, har bir harf va belgini xatosiz, chaqqonlik bilan bosing va raqiblaringizdan o'zib ketib g'alaba qozoning!",
      category: 'jang',
      language: 'uz',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'txt_8',
      title: 'JavaScript Function Snippet',
      content: "function calculateWPM(totalChars, timeInSeconds) { const words = totalChars / 5; return Math.round((words / timeInSeconds) * 60); }",
      category: 'kod',
      language: 'en',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'txt_9',
      title: 'Express.js Server Code',
      content: "const express = require('express'); const app = express(); app.get('/api/health', (req, res) => res.json({ status: 'ok' })); app.listen(3000);",
      category: 'kod',
      language: 'en',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'txt_10',
      title: 'Respublika Musobaqasi Matni',
      content: "O'zbekiston bo'ylab eng tez va aniq yozadigan mutaxassislarni aniqlash musobaqasi. Barcha qatnashchilarga sertifikat va sovrinli reyting ballari taqdim etiladi.",
      category: 'musobaqalar',
      language: 'uz',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'txt_11',
      title: 'Rasmiy Malakaviy Sertifikat Matni',
      content: "Ushbu sertifikat rasman tasdiqlaydi-ki, foydalanuvchi ProSkill IT Academy platformasida tezkor yozish imtihonini muvaffaqiyatli topshirdi.",
      category: 'sertifikat',
      language: 'uz',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]
};

function readDB(): DBData {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultDB, null, 2), 'utf-8');
      return defaultDB;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    const db: DBData = JSON.parse(data);

    if (!db.texts || !Array.isArray(db.texts) || db.texts.length === 0) {
      db.texts = defaultDB.texts;
      writeDB(db);
    }

    if (!db.certificates || !Array.isArray(db.certificates)) {
      db.certificates = [];
      writeDB(db);
    }

    // Ensure admin user 'yy' exists with password 'yy' and role 'admin'
    const adminUser = db.users.find(u => u.login.toLowerCase() === 'yy');
    if (!adminUser) {
      db.users.push({
        id: 'admin_1',
        login: 'yy',
        ism: 'Yahyobek',
        familiya: 'Yaqubboyev',
        password: 'yy',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
        role: 'admin',
        created_at: new Date().toISOString(),
        wpm_max: 118,
        accuracy_avg: 99.2,
        tests_completed: 142,
        badges: ['Master Typist', 'Tizim Administratori', 'Chempion', 'Tezkor Barmoqlar'],
        total_words_typed: 18500,
      });
      writeDB(db);
    } else if (adminUser.role !== 'admin' || adminUser.password !== 'yy') {
      adminUser.role = 'admin';
      adminUser.password = 'yy';
      writeDB(db);
    }

    return db;

  } catch (err) {
    console.error('Error reading DB, using fallback:', err);
    return defaultDB;
  }
}

function writeDB(data: DBData) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing DB:', err);
  }
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Auth Login
app.post('/api/auth/login', (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) {
    return res.status(400).json({ error: "Login va parol kiritilishi shart" });
  }

  const db = readDB();
  const user = db.users.find(u => u.login.toLowerCase() === login.trim().toLowerCase());

  if (!user || user.password !== password) {
    return res.status(401).json({ error: "Login yoki parol noto'g'ri" });
  }

  // Return clean user info
  const { password: _, ...userWithoutPassword } = user;
  res.json({
    user: userWithoutPassword,
    redirectAdmin: user.role === 'admin' || (login === 'yy' && password === 'yy')
  });
});

// Auth Register
app.post('/api/auth/register', (req, res) => {
  const { login, ism, familiya, password } = req.body;

  if (!login || !ism || !familiya || !password) {
    return res.status(400).json({ error: "Barcha maydonlarni to'ldiring" });
  }

  const db = readDB();
  const existing = db.users.find(u => u.login.toLowerCase() === login.trim().toLowerCase());
  if (existing) {
    return res.status(400).json({ error: "Bu login allaqachon mavjud. Boshqa login tanlang." });
  }

  // Check if credentials are yy/yy to make admin automatically
  const isAdmin = (login.trim() === 'yy' && password === 'yy');

  const newUser = {
    id: 'user_' + Date.now(),
    login: login.trim(),
    ism: ism.trim(),
    familiya: familiya.trim(),
    password: password,
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(login)}`,
    role: isAdmin ? ('admin' as const) : ('user' as const),
    created_at: new Date().toISOString(),
    wpm_max: 0,
    accuracy_avg: 0,
    tests_completed: 0,
    badges: isAdmin ? ['Tizim Administratori', "Yangi A'zolar"] : ["Yangi A'zolar"],
    total_words_typed: 0,
  };

  db.users.push(newUser);
  writeDB(db);

  const { password: _, ...userWithoutPassword } = newUser;
  res.json({
    user: userWithoutPassword,
    redirectAdmin: isAdmin
  });
});

// Profile Picture Upload Endpoint
app.post('/api/user/upload-avatar', (req, res) => {
  try {
    const { userId, imageBase64, mimeType } = req.body;

    if (!userId || !imageBase64) {
      return res.status(400).json({ error: "Foydalanuvchi va rasm ma'lumoti kiritilishi shart" });
    }

    const db = readDB();
    const user = db.users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: "Foydalanuvchi topilmadi" });
    }

    let base64Data = imageBase64;
    let detectedMime = mimeType || '';

    if (imageBase64.startsWith('data:')) {
      const parts = imageBase64.split(';base64,');
      detectedMime = parts[0].replace('data:', '');
      base64Data = parts[1];
    }

    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (detectedMime && !allowedMimeTypes.includes(detectedMime.toLowerCase())) {
      return res.status(400).json({
        error: "Faqat JPG, JPEG, PNG va WEBP formatidagi rasmlar qabul qilinadi"
      });
    }

    let extension = 'jpg';
    if (detectedMime.includes('png')) extension = 'png';
    else if (detectedMime.includes('webp')) extension = 'webp';

    const buffer = Buffer.from(base64Data, 'base64');
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

    if (buffer.length > MAX_FILE_SIZE) {
      return res.status(400).json({
        error: "Fayl hajmi 5 MB dan oshmasligi kerak. Iltimos, kichikroq rasm tanlang."
      });
    }

    // Delete old custom avatar file if present in media/avatars
    if (user.avatar && user.avatar.startsWith('/media/avatars/')) {
      const oldFilename = path.basename(user.avatar);
      const oldPath = path.join(AVATARS_DIR, oldFilename);
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch (unlinkErr) {
          console.error("Old avatar delete error:", unlinkErr);
        }
      }
    }

    const newFilename = `avatar_${userId}_${Date.now()}.${extension}`;
    const newPath = path.join(AVATARS_DIR, newFilename);

    fs.writeFileSync(newPath, buffer);

    const relativePath = `/media/avatars/${newFilename}`;
    user.avatar = relativePath;

    // Sync avatar across competition participants
    db.competitions.forEach(comp => {
      if (comp.participants) {
        comp.participants.forEach(p => {
          if (p.user_id === userId) {
            p.avatar = relativePath;
          }
        });
      }
    });

    writeDB(db);

    const { password: _, ...updatedUser } = user;
    return res.json({
      success: true,
      avatar: relativePath,
      user: updatedUser,
      message: "Profil rasmi muvaffaqiyatli saqlandi."
    });
  } catch (err) {
    console.error("Upload avatar server error:", err);
    return res.status(500).json({ error: "Profil rasmini saqlashda server xatoligi yuz berdi" });
  }
});

// User Profile Update
app.put('/api/user/profile', (req, res) => {
  const { id, ism, familiya, login, password, avatar } = req.body;
  if (!id) {
    return res.status(400).json({ error: "Foydalanuvchi ID si kiritilmagan" });
  }

  const db = readDB();
  const userIndex = db.users.findIndex(u => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({ error: "Foydalanuvchi topilmadi" });
  }

  const user = db.users[userIndex];
  if (ism) user.ism = ism.trim();
  if (familiya) user.familiya = familiya.trim();
  if (login) user.login = login.trim();
  if (password) user.password = password;
  if (avatar) user.avatar = avatar;

  db.users[userIndex] = user;
  writeDB(db);

  const { password: _, ...updatedUser } = user;
  res.json({ user: updatedUser, message: "Profil muvaffaqiyatli yangilandi" });
});

// Get Leaderboard / Users
app.get('/api/users/leaderboard', (req, res) => {
  const db = readDB();
  // Filter out password and sort by highest WPM
  const sorted = db.users
    .map(({ password: _, ...u }) => u)
    .sort((a, b) => b.wpm_max - a.wpm_max);
  res.json(sorted);
});

// Submit Test Result
app.post('/api/stats/submit', (req, res) => {
  const { userId, wpm, cpm, accuracy, errors, testType, textTitle, wordsCount } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "Foydalanuvchi ma'lumoti yetishmayapti" });
  }

  const db = readDB();
  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "Foydalanuvchi topilmadi" });
  }

  const newResult = {
    id: 'res_' + Date.now(),
    user_id: user.id,
    user_name: `${user.ism} ${user.familiya}`,
    wpm: Number(wpm) || 0,
    cpm: Number(cpm) || 0,
    accuracy: Number(accuracy) || 0,
    errors: Number(errors) || 0,
    test_type: testType || 'practice',
    date: new Date().toISOString(),
    text_title: textTitle || 'Tezlik Testi'
  };

  db.results.push(newResult);

  // Update user stats in DB
  user.tests_completed += 1;
  user.total_words_typed = (user.total_words_typed || 0) + (Number(wordsCount) || Math.round(Number(wpm) * 0.5));
  if (Number(wpm) > user.wpm_max) {
    user.wpm_max = Number(wpm);
  }
  
  // Calculate new average accuracy
  const userResults = db.results.filter(r => r.user_id === userId);
  const totalAcc = userResults.reduce((sum, r) => sum + r.accuracy, 0);
  user.accuracy_avg = Math.round((totalAcc / userResults.length) * 10) / 10;

  // Add badges if milestones reached
  if (user.wpm_max >= 100 && !user.badges.includes('100+ WPM Master')) {
    user.badges.push('100+ WPM Master');
  }
  if (user.tests_completed >= 50 && !user.badges.includes('Klaviatura Faxriysi')) {
    user.badges.push('Klaviatura Faxriysi');
  }

  writeDB(db);

  const { password: _, ...updatedUser } = user;
  res.json({ result: newResult, user: updatedUser });
});

// Server time endpoint for accurate synchronized competition timer
app.get('/api/server-time', (req, res) => {
  res.json({ timestamp: Date.now() });
});

// Helper: Check if user is eligible for a certificate in a competition based on certificate_policy
function isUserEligibleForCompCert(comp: any, userId: string): boolean {
  if (!comp) return false;
  const policy = comp.certificate_policy || 'none';
  if (policy === 'none') return false;
  const part = comp.participants?.find((p: any) => p.user_id === userId);
  if (!part) return false;
  const rank = part.rank || (comp.participants.indexOf(part) + 1);
  if (policy === 'winner_only') return rank === 1;
  if (policy === 'top_3') return rank <= 3;
  if (policy === 'all_participants') return true;
  return false;
}

// Get User Certificates
app.get('/api/certificates/user/:userId', (req, res) => {
  const { userId } = req.params;
  const db = readDB();

  if (!db.certificates) db.certificates = [];
  const user = db.users.find(u => u.id === userId);

  // Filter existing certificates in db.certificates for user
  // If a certificate is for a competition (starts with "Musobaqa:"), verify user is eligible under the competition's certificate_policy
  let userCerts = db.certificates.filter(c => {
    if (c.user_id !== userId) return false;
    if (c.test_type && c.test_type.startsWith('Musobaqa:')) {
      const compTitle = c.test_type.replace('Musobaqa:', '').trim();
      const comp = db.competitions.find(comp => comp.title === compTitle || c.id.includes(comp.id.slice(0, 4).toUpperCase()));
      if (!comp) return false;
      return isUserEligibleForCompCert(comp, userId);
    }
    return true;
  });

  // If user exists and has test/result activity but no certificate record yet, dynamically check official achievements
  if (user && !userCerts.some(c => c.test_type === "Rasmiy Sertifikat Imtihoni") && (user.tests_completed > 0 || user.wpm_max > 0)) {
    const wpm = user.wpm_max || 45;
    const acc = user.accuracy_avg || 98.5;
    const netWpm = Math.max(0, Math.round(wpm * (acc / 100)));

    const officialCert = {
      id: `PSAK-2026-${String(user.id).padStart(6, '0')}`,
      user_id: user.id,
      user_name: `${user.ism} ${user.familiya}`,
      login: user.login,
      user_avatar: user.avatar,
      wpm,
      net_wpm: netWpm,
      accuracy: acc,
      test_type: "Rasmiy Sertifikat Imtihoni",
      date: new Date(user.created_at || Date.now()).toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };
    db.certificates.unshift(officialCert);
    userCerts.unshift(officialCert);

    // Check competitions where user participated and is eligible based on certificate_policy
    db.competitions.forEach(comp => {
      if (isUserEligibleForCompCert(comp, userId)) {
        const part = comp.participants.find(p => p.user_id === userId);
        if (part) {
          const certId = `PSAK-COMP-${comp.id.slice(0, 4).toUpperCase()}-${String(user.id).padStart(4, '0')}`;
          if (!userCerts.some(c => c.id === certId)) {
            const compCert = {
              id: certId,
              user_id: user.id,
              user_name: `${user.ism} ${user.familiya}`,
              login: user.login,
              user_avatar: user.avatar,
              wpm: part.wpm,
              net_wpm: Math.max(0, Math.round(part.wpm * (part.accuracy / 100))),
              accuracy: part.accuracy,
              test_type: `Musobaqa: ${comp.title}`,
              date: new Date(part.joined_at || Date.now()).toISOString().split('T')[0],
              created_at: new Date().toISOString()
            };
            db.certificates.push(compCert);
            userCerts.push(compCert);
          }
        }
      }
    });

    writeDB(db);
  }

  // Deduplicate certificates by ID
  const uniqueCertsMap = new Map<string, any>();
  userCerts.forEach(c => uniqueCertsMap.set(c.id, c));
  const finalCerts = Array.from(uniqueCertsMap.values());

  res.json(finalCerts);
});

// Create Certificate
app.post('/api/certificates', (req, res) => {
  const { userId, wpm, netWpm, accuracy, testType } = req.body;
  const db = readDB();
  if (!db.certificates) db.certificates = [];

  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const numWpm = Number(wpm);
  const numAcc = Number(accuracy);
  const numNetWpm = netWpm !== undefined ? Number(netWpm) : Math.max(0, Math.round(numWpm * (numAcc / 100)));

  const newCert = {
    id: `PSAK-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
    user_id: user.id,
    user_name: `${user.ism} ${user.familiya}`,
    login: user.login,
    user_avatar: user.avatar,
    wpm: numWpm,
    net_wpm: numNetWpm,
    accuracy: numAcc,
    test_type: testType || "Rasmiy Sertifikat Imtihoni",
    date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString()
  };

  db.certificates.unshift(newCert);
  writeDB(db);
  res.json(newCert);
});

// Get Single Certificate by ID
app.get('/api/certificates/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  if (!db.certificates) db.certificates = [];

  let cert = db.certificates.find(c => c.id === id);

  // If not found directly, check if it matches dynamic user cert ID format (e.g., PSAK-2026-000001)
  if (!cert && id.startsWith('PSAK-')) {
    const parts = id.split('-');
    if (parts.length >= 3) {
      const rawUserId = parseInt(parts[2], 10);
      const user = db.users.find(u => u.id === String(rawUserId) || u.id === parts[2]);
      if (user) {
        const wpm = user.wpm_max || 45;
        const acc = user.accuracy_avg || 98.5;
        const netWpm = Math.max(0, Math.round(wpm * (acc / 100)));
        cert = {
          id,
          user_id: user.id,
          user_name: `${user.ism} ${user.familiya}`,
          login: user.login,
          user_avatar: user.avatar,
          wpm,
          net_wpm: netWpm,
          accuracy: acc,
          test_type: "Rasmiy Sertifikat Imtihoni",
          date: new Date(user.created_at || Date.now()).toISOString().split('T')[0],
          created_at: new Date().toISOString()
        };
      }
    }
  }

  if (!cert) {
    return res.status(404).json({ error: "Sertifikat topilmadi", message: "Certificate not found" });
  }

  res.json(cert);
});

// Certificate Verification Endpoint
app.get('/api/certificates/verify/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  if (!db.certificates) db.certificates = [];

  const cert = db.certificates.find(c => c.id === id);
  if (cert) {
    return res.json({
      verified: true,
      id: cert.id,
      user_name: cert.user_name,
      login: cert.login,
      test_type: cert.test_type,
      wpm: cert.wpm,
      net_wpm: cert.net_wpm,
      accuracy: cert.accuracy,
      date: cert.date,
      organization: "ProSkill IT Academy"
    });
  }

  res.status(404).json({ verified: false, error: "Yaroqsiz yoki topilmagan sertifikat kodi" });
});

// Backend PDF Download Endpoint
app.get('/api/certificates/:id/pdf', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  if (!db.certificates) db.certificates = [];

  const cert = db.certificates.find(c => c.id === id);
  if (!cert) {
    return res.status(404).json({ error: "Sertifikat topilmadi" });
  }

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="ProType_Sertifikat_${cert.id}.pdf"`);
  res.json({
    status: "ok",
    download_url: `/api/certificates/${cert.id}/pdf`,
    certificate: cert
  });
});

// Backend Image Download Endpoint
app.get('/api/certificates/:id/image', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  if (!db.certificates) db.certificates = [];

  const cert = db.certificates.find(c => c.id === id);
  if (!cert) {
    return res.status(404).json({ error: "Sertifikat topilmadi" });
  }

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="ProType_Sertifikat_${cert.id}.png"`);
  res.json({
    status: "ok",
    download_url: `/api/certificates/${cert.id}/image`,
    certificate: cert
  });
});

// Get User Results History
app.get('/api/stats/user/:userId', (req, res) => {
  const { userId } = req.params;
  const db = readDB();
  const userResults = db.results.filter(r => r.user_id === userId);
  res.json(userResults);
});

// Get Competitions
app.get('/api/competitions', (req, res) => {
  const db = readDB();
  res.json(db.competitions);
});

// Join & Submit Competition Score (One Attempt Only)
app.post('/api/competitions/:id/join', (req, res) => {
  const { id } = req.params;
  const {
    userId,
    wpm,
    accuracy,
    netWpm,
    errors,
    cpm,
    correctChars,
    incorrectChars,
    completionTime,
    totalCharsTyped,
    totalWordsTyped,
    completedPercentage,
    speedHistory,
    mistakeKeyboardHeatmap,
    mistakeDetails
  } = req.body;

  const db = readDB();
  const comp = db.competitions.find(c => c.id === id);
  if (!comp) {
    return res.status(404).json({ error: "Musobaqa topilmadi" });
  }

  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "Foydalanuvchi topilmadi" });
  }

  // Database Protection: Enforce Unique Attempt constraint (user_id, competition_id)
  const existingParticipant = comp.participants.find(p => p.user_id === userId);
  if (existingParticipant) {
    return res.status(409).json({
      error: "Siz ushbu musobaqada allaqachon qatnashgansiz.",
      message: "You have already participated in this competition.",
      alreadyParticipated: true,
      participant: existingParticipant,
      competition: comp
    });
  }

  const numWpm = Number(wpm);
  const numAcc = Number(accuracy);
  const numErrors = Number(errors || 0);
  const numCpm = Number(cpm || Math.round(numWpm * 5));
  const numNetWpm = netWpm !== undefined ? Number(netWpm) : Math.max(0, Math.round(numWpm * (numAcc / 100)));
  const numCorrectChars = Number(correctChars || Math.max(0, numCpm - numErrors));
  const numIncorrectChars = Number(incorrectChars || numErrors);
  const numCompTime = Number(completionTime || comp.duration || 60);

  const score = Math.round((numWpm * (numAcc / 100)) * 5);

  const newParticipant: (typeof comp.participants)[number] = {
    user_id: user.id,
    user_name: `${user.ism} ${user.familiya}`,
    avatar: user.avatar,
    wpm: numWpm,
    net_wpm: numNetWpm,
    accuracy: numAcc,
    cpm: numCpm,
    errors: numErrors,
    correct_chars: numCorrectChars,
    incorrect_chars: numIncorrectChars,
    total_chars_typed: Number(totalCharsTyped || (numCorrectChars + numIncorrectChars)),
    total_words_typed: Number(totalWordsTyped || Math.round((numCorrectChars + numIncorrectChars) / 5)),
    completed_percentage: Number(completedPercentage || 100),
    completion_time: numCompTime,
    duration: Number(comp.duration || 60),
    remaining_time: Math.max(0, Number(comp.duration || 60) - numCompTime),
    rating_points: Number(comp.reward_points || 50),
    total_participants: (comp.participants.length + 1),
    speed_history: Array.isArray(speedHistory) ? speedHistory : [],
    mistake_keyboard_heatmap: mistakeKeyboardHeatmap && typeof mistakeKeyboardHeatmap === 'object' ? mistakeKeyboardHeatmap : {},
    mistake_details: Array.isArray(mistakeDetails) ? mistakeDetails : [],
    score,
    joined_at: new Date().toISOString()
  };

  comp.participants.push(newParticipant);

  // Sort participants by score and update ranks
  comp.participants.sort((a, b) => b.score - a.score);
  comp.participants.forEach((p, idx) => {
    p.rank = idx + 1;
  });

  const finalRank = newParticipant.rank || 1;

  // Record test result in db.results
  const newResult = {
    id: `res_comp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    user_id: user.id,
    user_name: `${user.ism} ${user.familiya}`,
    wpm: numWpm,
    cpm: numCpm,
    accuracy: numAcc,
    errors: numErrors,
    test_type: 'competition' as const,
    date: new Date().toISOString(),
    text_title: comp.title
  };
  db.results.unshift(newResult);

  // Update user overall statistics and rating points
  user.tests_completed = (user.tests_completed || 0) + 1;
  user.wpm_max = Math.max(user.wpm_max || 0, numWpm);
  user.rating = (user.rating || 1000) + (comp.reward_points || 50);
  const userResults = db.results.filter(r => r.user_id === user.id);
  const totalAcc = userResults.reduce((sum, r) => sum + r.accuracy, 0);
  user.accuracy_avg = Math.round((totalAcc / userResults.length) * 10) / 10;

  // Generate an official certificate ONLY if user is eligible based on comp.certificate_policy
  let cert = null;
  if (isUserEligibleForCompCert(comp, user.id)) {
    if (!db.certificates) db.certificates = [];
    const certId = `PSAK-COMP-${comp.id.slice(0, 4).toUpperCase()}-${String(user.id).padStart(4, '0')}`;
    cert = db.certificates.find(c => c.id === certId || (c.user_id === user.id && c.test_type === `Musobaqa: ${comp.title}`));
    if (!cert) {
      cert = {
        id: certId,
        user_id: user.id,
        user_name: `${user.ism} ${user.familiya}`,
        login: user.login,
        user_avatar: user.avatar,
        wpm: numWpm,
        net_wpm: numNetWpm,
        accuracy: numAcc,
        test_type: `Musobaqa: ${comp.title}`,
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      };
      db.certificates.unshift(cert);
    }
  }

  writeDB(db);
  res.json({
    competition: comp,
    result: newResult,
    participant: newParticipant,
    certificate: cert,
    rank: finalRank,
    ratingPoints: comp.reward_points || 50
  });
});

// ADMIN ROUTES

// Admin check middleware helper
function checkAdminPermission(req: express.Request, res: express.Response): boolean {
  const adminId = req.headers['x-admin-id'];
  const db = readDB();
  const user = db.users.find(u => u.id === adminId);
  if (!user || user.role !== 'admin') {
    res.status(403).json({ error: "Ruxsat berilmagan. Faqat administratorlar uchun." });
    return false;
  }
  return true;
}

// Get All Users (Admin)
app.get('/api/admin/users', (req, res) => {
  if (!checkAdminPermission(req, res)) return;
  const db = readDB();
  const usersWithoutPass = db.users.map(({ password: _, ...u }) => u);
  res.json(usersWithoutPass);
});

// Admin Edit User
app.put('/api/admin/users/:id', (req, res) => {
  if (!checkAdminPermission(req, res)) return;
  const { id } = req.params;
  const { ism, familiya, login, role, wpm_max } = req.body;

  const db = readDB();
  const user = db.users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: "Foydalanuvchi topilmadi" });

  if (ism) user.ism = ism;
  if (familiya) user.familiya = familiya;
  if (login) user.login = login;
  if (role) user.role = role;
  if (wpm_max !== undefined) user.wpm_max = Number(wpm_max);

  writeDB(db);
  const { password: _, ...updated } = user;
  res.json(updated);
});

// Admin Delete User
app.delete('/api/admin/users/:id', (req, res) => {
  if (!checkAdminPermission(req, res)) return;
  const { id } = req.params;
  const adminId = req.headers['x-admin-id'] as string;

  if (id === adminId) {
    return res.status(400).json({ error: "O'z administrator hisobingizni o'chira olmaysiz!" });
  }

  const db = readDB();
  const initialLen = db.users.length;
  db.users = db.users.filter(u => u.id !== id);

  if (db.users.length === initialLen) {
    return res.status(404).json({ error: "Foydalanuvchi topilmadi" });
  }

  // Cascade delete related records safely
  db.results = db.results.filter(r => r.user_id !== id);
  db.competitions.forEach(c => {
    if (c.participants) {
      c.participants = c.participants.filter(p => p.user_id !== id);
    }
  });

  writeDB(db);
  res.json({ message: "Foydalanuvchi muvaffaqiyatli o'chirildi." });
});

// Admin Create New Administrator
app.post('/api/admin/create-admin', (req, res) => {
  if (!checkAdminPermission(req, res)) return;
  const { login, password, passwordConfirm, ism, familiya } = req.body;

  if (!login || !login.trim()) {
    return res.status(400).json({ error: "Administrator logi-ni kiritilishi shart." });
  }

  const cleanLogin = login.trim();
  if (cleanLogin.length < 3) {
    return res.status(400).json({ error: "Login kamida 3 ta belgidan iborat bo'lishi kerak." });
  }

  if (!password || password.length < 3) {
    return res.status(400).json({ error: "Parol kamida 3 ta belgidan iborat bo'lishi kerak." });
  }

  if (password !== passwordConfirm) {
    return res.status(400).json({ error: "Kiritilgan parollar bir-biriga mos kelmadi!" });
  }

  const db = readDB();
  const existingUser = db.users.find(u => u.login.toLowerCase() === cleanLogin.toLowerCase());
  if (existingUser) {
    return res.status(400).json({ error: `"${cleanLogin}" logindagi foydalanuvchi tizimda allaqachon mavjud. Iltimos boshqa login tanlang.` });
  }

  const newAdmin = {
    id: 'admin_' + Date.now(),
    login: cleanLogin,
    ism: ism && ism.trim() ? ism.trim() : 'Administrator',
    familiya: familiya && familiya.trim() ? familiya.trim() : cleanLogin.toUpperCase(),
    password: password,
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=' + encodeURIComponent(cleanLogin),
    role: 'admin' as const,
    created_at: new Date().toISOString(),
    wpm_max: 0,
    accuracy_avg: 100,
    tests_completed: 0,
    badges: ['Tizim Administratori', 'Master Typist'],
    total_words_typed: 0
  };

  db.users.push(newAdmin);
  writeDB(db);

  const { password: _, ...createdAdminWithoutPassword } = newAdmin;
  return res.json({
    success: true,
    message: "Yangi administrator muvaffaqiyatli qo'shildi.",
    user: createdAdminWithoutPassword
  });
});

// PUBLIC TEXTS API (For typing practice, tests, games, etc.)
app.get('/api/texts', (req, res) => {
  const { category, language } = req.query;
  const db = readDB();
  
  let list = (db.texts || []).filter(t => t.is_active);

  if (category && category !== 'barchasi') {
    list = list.filter(t => t.category === category);
  }

  if (language) {
    list = list.filter(t => t.language === language);
  }

  res.json(list);
});

// ADMIN TEXTS API (Complete CRUD)
app.get('/api/admin/texts', (req, res) => {
  if (!checkAdminPermission(req, res)) return;
  const { category, language, search, status } = req.query;

  const db = readDB();
  let list = db.texts || [];

  if (category && category !== 'barchasi') {
    list = list.filter(t => t.category === category);
  }

  if (language && language !== 'all') {
    list = list.filter(t => t.language === language);
  }

  if (status === 'active') {
    list = list.filter(t => t.is_active);
  } else if (status === 'inactive') {
    list = list.filter(t => !t.is_active);
  }

  if (search && typeof search === 'string' && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(t => t.title.toLowerCase().includes(q) || t.content.toLowerCase().includes(q));
  }

  res.json(list);
});

app.post('/api/admin/texts', (req, res) => {
  if (!checkAdminPermission(req, res)) return;
  const { title, content, category, language, is_active } = req.body;

  if (!title || !title.trim() || !content || !content.trim()) {
    return res.status(400).json({ error: "Matn sarlavhasi va mazmuni to'ldirilishi shart!" });
  }

  const db = readDB();
  const newText = {
    id: 'txt_' + Date.now(),
    title: title.trim(),
    content: content.trim(),
    category: category || 'mashq',
    language: language || 'uz',
    is_active: is_active !== undefined ? Boolean(is_active) : true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  db.texts.unshift(newText);
  writeDB(db);

  res.json({
    message: "Yangi matn muvaffaqiyatli qo'shildi.",
    text: newText
  });
});

app.put('/api/admin/texts/:id', (req, res) => {
  if (!checkAdminPermission(req, res)) return;
  const { id } = req.params;
  const { title, content, category, language, is_active } = req.body;

  const db = readDB();
  const item = db.texts.find(t => t.id === id);
  if (!item) {
    return res.status(404).json({ error: "Matn topilmadi" });
  }

  if (title) item.title = title.trim();
  if (content) item.content = content.trim();
  if (category) item.category = category;
  if (language) item.language = language;
  if (is_active !== undefined) item.is_active = Boolean(is_active);
  item.updated_at = new Date().toISOString();

  writeDB(db);
  res.json({
    message: "Matn o'zgarishlari saqlandi.",
    text: item
  });
});

// Helper function to safely delete texts and clean competition references
function removeTextsFromDB(db: DBData, textIdsToDelete: string[]) {
  const idsSet = new Set(textIdsToDelete);
  const initialCount = db.texts.length;

  // Filter out target texts
  db.texts = db.texts.filter(t => !idsSet.has(t.id));
  const deletedCount = initialCount - db.texts.length;

  let affectedCompetitionsCount = 0;

  // Clean references in competitions
  db.competitions.forEach(comp => {
    let touched = false;

    if (comp.selected_text_ids && Array.isArray(comp.selected_text_ids)) {
      const prevLen = comp.selected_text_ids.length;
      comp.selected_text_ids = comp.selected_text_ids.filter(id => !idsSet.has(id));
      if (comp.selected_text_ids.length !== prevLen) {
        touched = true;
      }
    }

    if (comp.texts_pool && Array.isArray(comp.texts_pool)) {
      const prevLen = comp.texts_pool.length;
      comp.texts_pool = comp.texts_pool.filter(tp => !idsSet.has(tp.id));
      if (comp.texts_pool.length !== prevLen) {
        touched = true;
      }
    }

    if (touched) {
      affectedCompetitionsCount++;
      // If pool has items, set primary text to first remaining item content
      if (comp.texts_pool && comp.texts_pool.length > 0) {
        comp.text = comp.texts_pool[0].content;
      } else if (comp.selected_text_ids && comp.selected_text_ids.length > 0) {
        const remainingText = db.texts.find(t => comp.selected_text_ids?.includes(t.id));
        if (remainingText) {
          comp.text = remainingText.content;
        }
      }
    }
  });

  return { deletedCount, affectedCompetitionsCount };
}

app.delete('/api/admin/texts/:id', (req, res) => {
  if (!checkAdminPermission(req, res)) return;
  const { id } = req.params;

  const db = readDB();
  const targetText = db.texts.find(t => t.id === id);
  if (!targetText) {
    return res.status(404).json({ error: "Matn topilmadi" });
  }

  // Check active competitions for warnings
  const activeCompUsing = db.competitions.filter(c =>
    c.status === 'active' && (
      c.selected_text_ids?.includes(id) ||
      c.texts_pool?.some(tp => tp.id === id)
    )
  );

  const { deletedCount, affectedCompetitionsCount } = removeTextsFromDB(db, [id]);

  writeDB(db);

  res.json({
    success: true,
    message: "Matn muvaffaqiyatli o'chirildi.",
    deletedCount,
    affectedCompetitionsCount,
    warning: activeCompUsing.length > 0
      ? `Ushbu matn ${activeCompUsing.length} ta faol musobaqadan havfsiz ravishda olib tashlandi.`
      : null
  });
});

// Bulk Delete Texts
const handleBulkDeleteTexts = (req: express.Request, res: express.Response) => {
  if (!checkAdminPermission(req, res)) return;
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "O'chirish uchun birorta ham matn tanlanmagan!" });
  }

  const db = readDB();
  const { deletedCount, affectedCompetitionsCount } = removeTextsFromDB(db, ids);

  if (deletedCount === 0) {
    return res.status(404).json({ error: "Tanlangan matnlar bazadan topilmadi" });
  }

  writeDB(db);

  res.json({
    success: true,
    message: `${deletedCount} ta matn muvaffaqiyatli o'chirildi.`,
    deletedCount,
    affectedCompetitionsCount
  });
};

app.post('/api/admin/texts/bulk-delete', handleBulkDeleteTexts);
app.delete('/api/admin/texts/bulk-delete', handleBulkDeleteTexts);

app.patch('/api/admin/texts/:id/toggle', (req, res) => {
  if (!checkAdminPermission(req, res)) return;
  const { id } = req.params;

  const db = readDB();
  const item = db.texts.find(t => t.id === id);
  if (!item) {
    return res.status(404).json({ error: "Matn topilmadi" });
  }

  item.is_active = !item.is_active;
  item.updated_at = new Date().toISOString();

  writeDB(db);
  res.json({
    message: item.is_active ? "Matn faol holatga o'tkazildi." : "Matn nofaol holatga o'tkazildi.",
    text: item
  });
});


// Admin Promote User
app.post('/api/admin/users/:id/promote', (req, res) => {
  if (!checkAdminPermission(req, res)) return;
  const { id } = req.params;

  const db = readDB();
  const user = db.users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: "Foydalanuvchi topilmadi" });

  user.role = user.role === 'admin' ? 'user' : 'admin';
  if (user.role === 'admin' && !user.badges.includes('Tizim Administratori')) {
    user.badges.push('Tizim Administratori');
  }

  writeDB(db);
  const { password: _, ...updated } = user;
  res.json(updated);
});

// Admin Create Competition
app.post('/api/admin/competitions', (req, res) => {
  if (!checkAdminPermission(req, res)) return;
  const { title, description, text, reward_points, duration, selected_text_ids, texts_pool, duration_days, certificate_policy } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Musobaqa sarlavhasi kiritilishi shart" });
  }

  const db = readDB();

  let finalTextsPool: Array<{ id: string; title: string; content: string; category?: string; language?: string }> = [];

  if (Array.isArray(texts_pool) && texts_pool.length > 0) {
    finalTextsPool = [...texts_pool];
  } else if (Array.isArray(selected_text_ids) && selected_text_ids.length > 0) {
    finalTextsPool = db.texts.filter(t => selected_text_ids.includes(t.id));
  }

  if (text && text.trim()) {
    const customContent = text.trim();
    if (!finalTextsPool.some(t => t.content === customContent)) {
      finalTextsPool.unshift({
        id: 'txt_' + Date.now(),
        title: title.trim(),
        content: customContent,
        category: 'musobaqalar',
        language: 'uz'
      });
    }
  }

  if (finalTextsPool.length === 0) {
    return res.status(400).json({ error: "Iltimos, musobaqa uchun matn kiriting yoki tanlang!" });
  }

  const primaryText = finalTextsPool[0].content;
  const validDuration = [15, 30, 60, 120, 300].includes(Number(duration)) ? Number(duration) : 60;
  const days = Number(duration_days) || 7;
  const validPolicy = ['none', 'winner_only', 'top_3', 'all_participants'].includes(certificate_policy) ? certificate_policy : 'none';

  const newComp = {
    id: 'comp_' + Date.now(),
    title: title.trim(),
    description: description ? description.trim() : "Pro Type rasmiy tezkor yozuv musobaqasi.",
    start_time: new Date().toISOString(),
    end_time: new Date(Date.now() + days * 86400000).toISOString(),
    status: 'active' as const,
    text: primaryText,
    duration: validDuration,
    selected_text_ids: finalTextsPool.map(t => t.id),
    texts_pool: finalTextsPool,
    reward_points: Number(reward_points) || 200,
    certificate_policy: validPolicy,
    participants: [],
    created_by: 'Administrator'
  };

  db.competitions.unshift(newComp);
  writeDB(db);
  res.json(newComp);
});

// Admin Edit Competition
app.put('/api/admin/competitions/:id', (req, res) => {
  if (!checkAdminPermission(req, res)) return;
  const { id } = req.params;
  const { title, description, text, reward_points, duration, selected_text_ids, texts_pool, status, certificate_policy } = req.body;

  const db = readDB();
  const comp = db.competitions.find(c => c.id === id);
  if (!comp) return res.status(404).json({ error: "Musobaqa topilmadi" });

  if (title) comp.title = title.trim();
  if (description !== undefined) comp.description = description.trim();
  if (reward_points !== undefined) comp.reward_points = Number(reward_points);
  if (status) comp.status = status;
  if (duration !== undefined) {
    comp.duration = [15, 30, 60, 120, 300].includes(Number(duration)) ? Number(duration) : 60;
  }
  if (certificate_policy !== undefined) {
    comp.certificate_policy = ['none', 'winner_only', 'top_3', 'all_participants'].includes(certificate_policy) ? certificate_policy : 'none';
  }

  let finalTextsPool: Array<{ id: string; title: string; content: string; category?: string; language?: string }> = [];

  if (Array.isArray(texts_pool) && texts_pool.length > 0) {
    finalTextsPool = texts_pool;
  } else if (Array.isArray(selected_text_ids) && selected_text_ids.length > 0) {
    finalTextsPool = db.texts.filter(t => selected_text_ids.includes(t.id));
  } else if (text && text.trim()) {
    finalTextsPool = [{
      id: 'txt_' + Date.now(),
      title: comp.title,
      content: text.trim(),
      category: 'musobaqalar',
      language: 'uz'
    }];
  }

  if (finalTextsPool.length > 0) {
    comp.selected_text_ids = finalTextsPool.map(t => t.id);
    comp.texts_pool = finalTextsPool;
    comp.text = finalTextsPool[0].content;
  }

  writeDB(db);
  res.json(comp);
});

// Admin Finish Competition
app.post('/api/admin/competitions/:id/finish', (req, res) => {
  if (!checkAdminPermission(req, res)) return;
  const { id } = req.params;

  const db = readDB();
  const comp = db.competitions.find(c => c.id === id);
  if (!comp) return res.status(404).json({ error: "Musobaqa topilmadi" });

  comp.status = 'finished';
  writeDB(db);
  res.json(comp);
});

// Admin Delete Competition
app.delete('/api/admin/competitions/:id', (req, res) => {
  if (!checkAdminPermission(req, res)) return;
  const { id } = req.params;

  const db = readDB();
  db.competitions = db.competitions.filter(c => c.id !== id);
  writeDB(db);
  res.json({ message: "Musobaqa o'chirildi" });
});

// System Stats for Admin
app.get('/api/admin/stats', (req, res) => {
  if (!checkAdminPermission(req, res)) return;
  const db = readDB();

  const totalUsers = db.users.length;
  const totalTests = db.results.length;
  const avgWpm = totalUsers > 0
    ? Math.round(db.users.reduce((sum, u) => sum + u.wpm_max, 0) / totalUsers)
    : 0;
  const activeCompetitions = db.competitions.filter(c => c.status === 'active').length;

  const sortedUsers = [...db.users].sort((a, b) => b.wpm_max - a.wpm_max);
  const topUser = sortedUsers[0]
    ? { name: `${sortedUsers[0].ism} ${sortedUsers[0].familiya}`, wpm: sortedUsers[0].wpm_max }
    : { name: 'Mavjud emas', wpm: 0 };

  res.json({
    total_users: totalUsers,
    total_tests: totalTests,
    avg_wpm: avgWpm,
    active_competitions: activeCompetitions,
    top_typist: topUser
  });
});

// AI Generate Text endpoint using Gemini
app.post('/api/ai/generate-text', async (req, res) => {
  try {
    const { topic, difficulty } = req.body;
    const ai = getGeminiClient();

    const prompt = `Siz Pro Type platformasi uchun tez yozish mashqlari matnini tuzuvchi mutaxassisiz.
Mavzu: ${topic || 'Zamonaviy texnologiyalar'}
Qiyinchilik darajasi: ${difficulty || 'O\'rtacha'}

Talablar:
1. Faqat o'zbek tilida, grammatik jihatdan mukammal va ma'noli 40-70 so'zdan iborat ravon matn yarating.
2. Hech qanday inglizcha so'z, izoh, kirish yoki xulosa bermang. Faqatgina teriladigan o'zbekcha matnning o'zini qaytaring.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    const generatedText = response.text ? response.text.trim() : "O'zbekiston — boy tarix, go'zal tabiat va unikal madaniyatga ega bo'lgan mehmondo'st mamlakat. Mamlakatimizda yoshlar ta'limi va raqamli texnologiyalarga alohida e'tibor qaratilmoqda.";
    res.json({ text: generatedText });
  } catch (error: any) {
    console.error("Gemini AI error:", error);
    res.status(500).json({
      error: "AI matn yaratishda xatolik yuz berdi",
      fallbackText: "Texnologiyalar olamida har bir soniya yangi kashfiyotlar va imkoniyatlar eshigini ochadi. Klaviatura orqali o'z fikrlaringizni chaqqon va aniq yetkazish zamonaviy mutaxassisning eng muhim ko'nikmalaridan biridir."
    });
  }
});

// REAL-TIME ONLINE BATTLES
interface BattlePlayerState {
  wpm: number;
  accuracy: number;
  progress: number;
  errors: number;
  timeSec: number;
  netWpm: number;
  finished: boolean;
  charCount?: number;
  combo?: number;
}

interface BattleRoom {
  id: string;
  inviterId: string;
  inviterName: string;
  inviterAvatar?: string;
  inviterRating: number;
  inviterReady: boolean;
  inviterState: BattlePlayerState;

  inviteeId: string;
  inviteeName: string;
  inviteeAvatar?: string;
  inviteeRating: number;
  inviteeReady: boolean;
  inviteeState: BattlePlayerState;

  status: 'pending' | 'accepted' | 'declined' | 'waiting' | 'countdown' | 'racing' | 'finished' | 'cancelled';
  text: string;
  textId?: string;
  duration: number; // fixed 30s
  startTime?: number;
  winnerId?: string | 'tie';
  winnerReason?: string;
  ratingChanges?: Record<string, number>;
  createdAt: number;
}

const connectedSockets = new Map<string, WebSocket>(); // userId -> ws
const activeBattlesMap = new Map<string, BattleRoom>(); // battleId -> BattleRoom
let lastUsedBattleTextId = '';

// Helper to pick non-consecutive random text from admin database
function getNextBattleText(): { text: string; textId: string } {
  const db = readDB();
  const activeTexts = (db.texts || []).filter(t => t.is_active);
  if (activeTexts.length > 0) {
    let pool = activeTexts.filter(t => t.id !== lastUsedBattleTextId);
    if (pool.length === 0) pool = activeTexts;
    const selected = pool[Math.floor(Math.random() * pool.length)];
    lastUsedBattleTextId = selected.id;
    return { text: selected.content, textId: selected.id };
  }
  return {
    text: "Musobaqa va jang jarayonida tezlik hamda sovuqqonlik muhim rol o'ynaydi. Har bir barmoq harakati aniq va muvozanatli bo'lishi kerak.",
    textId: 'fallback_1'
  };
}

// Broadcast list of all registered users with live status and ratings to all clients
function broadcastOnlineUsers() {
  const db = readDB();
  const usersList = db.users.map(({ password: _, ...u }) => {
    const isSocketConnected = connectedSockets.has(u.id);
    let status: 'Online' | 'In Battle' | 'Offline' = 'Offline';
    if (isSocketConnected) {
      status = 'Online';
      activeBattlesMap.forEach(room => {
        if ((room.inviterId === u.id || room.inviteeId === u.id) && (room.status === 'waiting' || room.status === 'racing' || room.status === 'countdown')) {
          status = 'In Battle';
        }
      });
    }
    return {
      ...u,
      rating: u.rating || 1200,
      status,
      isOnline: status !== 'Offline'
    };
  });

  const payload = JSON.stringify({ type: 'ONLINE_USERS_UPDATE', users: usersList });
  connectedSockets.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  });
  return usersList;
}

// Finish Battle Room & Calculate Ratings (+20 for winner, -10 for loser)
function finishBattleRoom(room: BattleRoom, forfeitedUserId?: string) {
  if (room.status === 'finished' || room.status === 'cancelled') return;

  room.status = 'finished';

  let winnerId: string | 'tie' = 'tie';
  let winnerReason = '';

  if (forfeitedUserId) {
    winnerId = room.inviterId === forfeitedUserId ? room.inviteeId : room.inviterId;
    winnerReason = "Raqib jangni tark etdi / aloqani uzdi.";
  } else {
    const uNet = room.inviterState.netWpm;
    const oNet = room.inviteeState.netWpm;

    if (uNet > oNet) {
      winnerId = room.inviterId;
      winnerReason = `Yuqori Net WPM (${uNet} vs ${oNet})`;
    } else if (oNet > uNet) {
      winnerId = room.inviteeId;
      winnerReason = `Yuqori Net WPM (${oNet} vs ${uNet})`;
    } else {
      if (room.inviterState.accuracy > room.inviteeState.accuracy) {
        winnerId = room.inviterId;
        winnerReason = `Yuqori Aniqlik (${room.inviterState.accuracy}% vs ${room.inviteeState.accuracy}%)`;
      } else if (room.inviteeState.accuracy > room.inviterState.accuracy) {
        winnerId = room.inviteeId;
        winnerReason = `Yuqori Aniqlik (${room.inviteeState.accuracy}% vs ${room.inviterState.accuracy}%)`;
      } else {
        winnerId = 'tie';
        winnerReason = 'Teng kuchli va ajoyib jang!';
      }
    }
  }

  room.winnerId = winnerId;
  room.winnerReason = winnerReason;

  // Calculate & Update Ratings in DB (+20 winner, -10 loser)
  const db = readDB();
  const inviterUser = db.users.find(u => u.id === room.inviterId);
  const inviteeUser = db.users.find(u => u.id === room.inviteeId);

  const ratingChanges: Record<string, number> = {};

  if (inviterUser && inviteeUser) {
    if (winnerId === room.inviterId) {
      inviterUser.rating = (inviterUser.rating || 1200) + 20;
      inviteeUser.rating = Math.max(0, (inviteeUser.rating || 1200) - 10);
      ratingChanges[room.inviterId] = +20;
      ratingChanges[room.inviteeId] = -10;
    } else if (winnerId === room.inviteeId) {
      inviteeUser.rating = (inviteeUser.rating || 1200) + 20;
      inviterUser.rating = Math.max(0, (inviterUser.rating || 1200) - 10);
      ratingChanges[room.inviteeId] = +20;
      ratingChanges[room.inviterId] = -10;
    } else {
      ratingChanges[room.inviterId] = 0;
      ratingChanges[room.inviteeId] = 0;
    }

    inviterUser.tests_completed = (inviterUser.tests_completed || 0) + 1;
    inviteeUser.tests_completed = (inviteeUser.tests_completed || 0) + 1;
    if (room.inviterState.wpm > (inviterUser.wpm_max || 0)) inviterUser.wpm_max = room.inviterState.wpm;
    if (room.inviteeState.wpm > (inviteeUser.wpm_max || 0)) inviteeUser.wpm_max = room.inviteeState.wpm;

    db.results.unshift({
      id: 'res_' + Date.now(),
      user_id: room.inviterId,
      user_name: room.inviterName,
      wpm: room.inviterState.wpm,
      cpm: Math.round(room.inviterState.wpm * 5),
      accuracy: room.inviterState.accuracy,
      errors: room.inviterState.errors,
      test_type: 'battle',
      date: new Date().toISOString(),
      text_title: 'Online Battle (30s)'
    });
    db.results.unshift({
      id: 'res_' + (Date.now() + 1),
      user_id: room.inviteeId,
      user_name: room.inviteeName,
      wpm: room.inviteeState.wpm,
      cpm: Math.round(room.inviteeState.wpm * 5),
      accuracy: room.inviteeState.accuracy,
      errors: room.inviteeState.errors,
      test_type: 'battle',
      date: new Date().toISOString(),
      text_title: 'Online Battle (30s)'
    });

    writeDB(db);
  }

  room.ratingChanges = ratingChanges;
  activeBattlesMap.set(room.id, room);

  const finishPayload = JSON.stringify({ type: 'BATTLE_FINISHED', room });
  [room.inviterId, room.inviteeId].forEach(uid => {
    const ws = connectedSockets.get(uid);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(finishPayload);
    }
  });

  broadcastOnlineUsers();
}

// Heartbeat endpoint
app.post('/api/battle/heartbeat', (req, res) => {
  res.json({ ok: true });
});

// Get Online Users List
app.get('/api/battle/online-users', (req, res) => {
  const usersList = broadcastOnlineUsers();
  res.json(usersList);
});

// Send Battle Invitation
app.post('/api/battle/invite', (req, res) => {
  const { inviterId, inviteeId } = req.body;
  if (!inviterId || !inviteeId) {
    return res.status(400).json({ error: "Inviter va Invitee ID kiritilishi shart" });
  }

  const db = readDB();
  const inviter = db.users.find(u => u.id === inviterId);
  const invitee = db.users.find(u => u.id === inviteeId);

  if (!inviter || !invitee) {
    return res.status(404).json({ error: "Foydalanuvchilar topilmadi" });
  }

  const battleId = 'btl_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  const { text, textId } = getNextBattleText();

  const room: BattleRoom = {
    id: battleId,
    inviterId: inviter.id,
    inviterName: `${inviter.ism} ${inviter.familiya}`,
    inviterAvatar: inviter.avatar,
    inviterRating: inviter.rating || 1200,
    inviterReady: false,
    inviterState: { wpm: 0, accuracy: 100, progress: 0, errors: 0, timeSec: 0, netWpm: 0, finished: false, charCount: 0, combo: 0 },

    inviteeId: invitee.id,
    inviteeName: `${invitee.ism} ${invitee.familiya}`,
    inviteeAvatar: invitee.avatar,
    inviteeRating: invitee.rating || 1200,
    inviteeReady: false,
    inviteeState: { wpm: 0, accuracy: 100, progress: 0, errors: 0, timeSec: 0, netWpm: 0, finished: false, charCount: 0, combo: 0 },

    status: 'pending',
    text,
    textId,
    duration: 30, // Fixed 30 seconds
    createdAt: Date.now()
  };

  activeBattlesMap.set(battleId, room);

  const inviteeSocket = connectedSockets.get(inviteeId);
  if (inviteeSocket && inviteeSocket.readyState === WebSocket.OPEN) {
    inviteeSocket.send(JSON.stringify({ type: 'INCOMING_CHALLENGE', room }));
  }

  res.json({ battleId, room });
});

// Poll Notifications & Active Battle Room for User
app.get('/api/battle/notifications/:userId', (req, res) => {
  const { userId } = req.params;
  let activeRoom: BattleRoom | null = null;
  let incomingInvite: BattleRoom | null = null;

  activeBattlesMap.forEach((room) => {
    if (room.inviteeId === userId && room.status === 'pending') {
      incomingInvite = room;
    }
    if ((room.inviterId === userId || room.inviteeId === userId) && room.status !== 'finished' && room.status !== 'cancelled' && room.status !== 'declined') {
      activeRoom = room;
    }
  });

  res.json({ incomingInvite, activeRoom });
});

// Respond to Invitation (Accept or Decline)
app.post('/api/battle/respond', (req, res) => {
  const { battleId, userId, action } = req.body;
  const room = activeBattlesMap.get(battleId);

  if (!room) {
    return res.status(404).json({ error: "Jang xonasi topilmadi" });
  }

  if (room.inviteeId !== userId) {
    return res.status(403).json({ error: "Ruxsat berilmagan" });
  }

  if (action === 'accept') {
    room.status = 'waiting';
    activeBattlesMap.set(battleId, room);

    [room.inviterId, room.inviteeId].forEach(uid => {
      const ws = connectedSockets.get(uid);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'CHALLENGE_ACCEPTED', room }));
      }
    });
  } else {
    room.status = 'declined';
    activeBattlesMap.set(battleId, room);

    const inviterSocket = connectedSockets.get(room.inviterId);
    if (inviterSocket && inviterSocket.readyState === WebSocket.OPEN) {
      inviterSocket.send(JSON.stringify({
        type: 'CHALLENGE_DECLINED',
        battleId,
        message: `${room.inviteeName} sizning taklifingizni rad etdi.`
      }));
    }
  }

  broadcastOnlineUsers();
  res.json({ room });
});

// Mark Player Ready ("Boshlash" pressed in waiting room)
app.post('/api/battle/ready', (req, res) => {
  const { battleId, userId } = req.body;
  const room = activeBattlesMap.get(battleId);

  if (!room) {
    return res.status(404).json({ error: "Jang xonasi topilmadi" });
  }

  if (room.inviterId === userId) {
    room.inviterReady = true;
  } else if (room.inviteeId === userId) {
    room.inviteeReady = true;
  }

  if (room.inviterReady && room.inviteeReady) {
    room.status = 'racing';
    room.startTime = Date.now();

    [room.inviterId, room.inviteeId].forEach(uid => {
      const ws = connectedSockets.get(uid);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'BATTLE_STARTED', room }));
      }
    });

    setTimeout(() => {
      const currentRoom = activeBattlesMap.get(battleId);
      if (currentRoom && currentRoom.status === 'racing') {
        finishBattleRoom(currentRoom);
      }
    }, 31000);
  } else {
    room.status = 'waiting';
    [room.inviterId, room.inviteeId].forEach(uid => {
      const ws = connectedSockets.get(uid);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ROOM_UPDATE', room }));
      }
    });
  }

  activeBattlesMap.set(battleId, room);
  res.json({ room });
});

// Update Live Progress during Battle
app.post('/api/battle/update-progress', (req, res) => {
  const { battleId, userId, wpm, accuracy, progress, errors, timeSec, netWpm, charCount, combo, finished } = req.body;
  const room = activeBattlesMap.get(battleId);

  if (!room) {
    return res.status(404).json({ error: "Jang xonasi topilmadi" });
  }

  const stateData: BattlePlayerState = {
    wpm: Number(wpm) || 0,
    accuracy: Number(accuracy) || 100,
    progress: Math.min(100, Number(progress) || 0),
    errors: Number(errors) || 0,
    timeSec: Number(timeSec) || 0,
    netWpm: Number(netWpm) || 0,
    charCount: Number(charCount) || 0,
    combo: Number(combo) || 0,
    finished: Boolean(finished)
  };

  if (room.inviterId === userId) {
    room.inviterState = stateData;
  } else if (room.inviteeId === userId) {
    room.inviteeState = stateData;
  }

  activeBattlesMap.set(battleId, room);

  [room.inviterId, room.inviteeId].forEach(uid => {
    const ws = connectedSockets.get(uid);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ROOM_PROGRESS', room }));
    }
  });

  if (room.inviterState.progress >= 100 && room.inviteeState.progress >= 100) {
    finishBattleRoom(room);
  }

  res.json({ room });
});

// Leave / Cancel Battle
app.post('/api/battle/leave', (req, res) => {
  const { battleId, userId } = req.body;
  const room = activeBattlesMap.get(battleId);

  if (room) {
    finishBattleRoom(room, userId);
  }

  res.json({ ok: true });
});

// Get Live Room State
app.get('/api/battle/room/:battleId', (req, res) => {
  const { battleId } = req.params;
  const room = activeBattlesMap.get(battleId);
  if (!room) {
    return res.status(404).json({ error: "Jang topilmadi" });
  }
  res.json({ room });
});

// Catch-all 404 for API routes so they return JSON instead of falling through to SPA HTML
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// Vite Middleware & Production static serving with WebSocket Server
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const httpServer = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Pro Type server running on http://0.0.0.0:${PORT}`);
  });

  // Attach WebSocket Server
  const wss = new WebSocketServer({ server: httpServer });

  wss.on('connection', (ws: WebSocket) => {
    let currentUserId: string | null = null;

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === 'AUTH' && data.userId) {
          currentUserId = data.userId;
          connectedSockets.set(data.userId, ws);
          broadcastOnlineUsers();
        }

        if (data.type === 'SEND_CHALLENGE' && data.inviterId && data.inviteeId) {
          const db = readDB();
          const inviter = db.users.find(u => u.id === data.inviterId);
          const invitee = db.users.find(u => u.id === data.inviteeId);

          if (inviter && invitee) {
            const battleId = 'btl_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
            const { text, textId } = getNextBattleText();

            const room: BattleRoom = {
              id: battleId,
              inviterId: inviter.id,
              inviterName: `${inviter.ism} ${inviter.familiya}`,
              inviterAvatar: inviter.avatar,
              inviterRating: inviter.rating || 1200,
              inviterReady: false,
              inviterState: { wpm: 0, accuracy: 100, progress: 0, errors: 0, timeSec: 0, netWpm: 0, finished: false, charCount: 0, combo: 0 },

              inviteeId: invitee.id,
              inviteeName: `${invitee.ism} ${invitee.familiya}`,
              inviteeAvatar: invitee.avatar,
              inviteeRating: invitee.rating || 1200,
              inviteeReady: false,
              inviteeState: { wpm: 0, accuracy: 100, progress: 0, errors: 0, timeSec: 0, netWpm: 0, finished: false, charCount: 0, combo: 0 },

              status: 'pending',
              text,
              textId,
              duration: 30, // Fixed 30s
              createdAt: Date.now()
            };

            activeBattlesMap.set(battleId, room);

            const targetWs = connectedSockets.get(invitee.id);
            if (targetWs && targetWs.readyState === WebSocket.OPEN) {
              targetWs.send(JSON.stringify({ type: 'INCOMING_CHALLENGE', room }));
            }
            ws.send(JSON.stringify({ type: 'CHALLENGE_SENT', room }));
          }
        }

        if (data.type === 'RESPOND_CHALLENGE' && data.battleId && data.userId) {
          const room = activeBattlesMap.get(data.battleId);
          if (room && room.inviteeId === data.userId) {
            if (data.action === 'accept') {
              room.status = 'waiting';
              activeBattlesMap.set(room.id, room);
              [room.inviterId, room.inviteeId].forEach(uid => {
                const targetWs = connectedSockets.get(uid);
                if (targetWs && targetWs.readyState === WebSocket.OPEN) {
                  targetWs.send(JSON.stringify({ type: 'CHALLENGE_ACCEPTED', room }));
                }
              });
            } else {
              room.status = 'declined';
              activeBattlesMap.set(room.id, room);
              const inviterWs = connectedSockets.get(room.inviterId);
              if (inviterWs && inviterWs.readyState === WebSocket.OPEN) {
                inviterWs.send(JSON.stringify({
                  type: 'CHALLENGE_DECLINED',
                  battleId: room.id,
                  message: `${room.inviteeName} sizning taklifingizni rad etdi.`
                }));
              }
            }
            broadcastOnlineUsers();
          }
        }

        if (data.type === 'PLAYER_READY' && data.battleId && data.userId) {
          const room = activeBattlesMap.get(data.battleId);
          if (room) {
            if (room.inviterId === data.userId) room.inviterReady = true;
            if (room.inviteeId === data.userId) room.inviteeReady = true;

            if (room.inviterReady && room.inviteeReady) {
              room.status = 'racing';
              room.startTime = Date.now();
              activeBattlesMap.set(room.id, room);

              [room.inviterId, room.inviteeId].forEach(uid => {
                const targetWs = connectedSockets.get(uid);
                if (targetWs && targetWs.readyState === WebSocket.OPEN) {
                  targetWs.send(JSON.stringify({ type: 'BATTLE_STARTED', room }));
                }
              });

              setTimeout(() => {
                const curr = activeBattlesMap.get(room.id);
                if (curr && curr.status === 'racing') {
                  finishBattleRoom(curr);
                }
              }, 31000);
            } else {
              room.status = 'waiting';
              activeBattlesMap.set(room.id, room);
              [room.inviterId, room.inviteeId].forEach(uid => {
                const targetWs = connectedSockets.get(uid);
                if (targetWs && targetWs.readyState === WebSocket.OPEN) {
                  targetWs.send(JSON.stringify({ type: 'ROOM_UPDATE', room }));
                }
              });
            }
          }
        }

        if (data.type === 'PROGRESS_UPDATE' && data.battleId && data.userId) {
          const room = activeBattlesMap.get(data.battleId);
          if (room) {
            const stateData: BattlePlayerState = {
              wpm: Number(data.wpm) || 0,
              accuracy: Number(data.accuracy) || 100,
              progress: Math.min(100, Number(data.progress) || 0),
              errors: Number(data.errors) || 0,
              timeSec: Number(data.timeSec) || 0,
              netWpm: Number(data.netWpm) || 0,
              charCount: Number(data.charCount) || 0,
              combo: Number(data.combo) || 0,
              finished: Boolean(data.finished)
            };

            if (room.inviterId === data.userId) room.inviterState = stateData;
            if (room.inviteeId === data.userId) room.inviteeState = stateData;

            activeBattlesMap.set(room.id, room);

            [room.inviterId, room.inviteeId].forEach(uid => {
              const targetWs = connectedSockets.get(uid);
              if (targetWs && targetWs.readyState === WebSocket.OPEN) {
                targetWs.send(JSON.stringify({ type: 'ROOM_PROGRESS', room }));
              }
            });

            if (room.inviterState.progress >= 100 && room.inviteeState.progress >= 100) {
              finishBattleRoom(room);
            }
          }
        }

        if (data.type === 'LEAVE_BATTLE' && data.battleId && data.userId) {
          const room = activeBattlesMap.get(data.battleId);
          if (room) {
            finishBattleRoom(room, data.userId);
          }
        }
      } catch (err) {
        console.error("WS message error:", err);
      }
    });

    ws.on('close', () => {
      if (currentUserId) {
        connectedSockets.delete(currentUserId);

        activeBattlesMap.forEach(room => {
          if ((room.inviterId === currentUserId || room.inviteeId === currentUserId) && room.status === 'racing') {
            const remainingId = room.inviterId === currentUserId ? room.inviteeId : room.inviterId;
            const remainingWs = connectedSockets.get(remainingId);
            if (remainingWs && remainingWs.readyState === WebSocket.OPEN) {
              remainingWs.send(JSON.stringify({ type: 'OPPONENT_DISCONNECTED', message: "Raqib aloqani uzdi." }));
            }
            finishBattleRoom(room, currentUserId);
          }
        });

        broadcastOnlineUsers();
      }
    });
  });
}

startServer();
