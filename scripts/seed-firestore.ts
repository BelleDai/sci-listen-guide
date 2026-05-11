import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Use require to load the JSON or export from TS. 
// Since episodeData is TS, we'll just define a mock here for seeding.
const episodeData = {
  id: "ep1",
  status: "published", // Critical for our CMS flow
  Title: "【科學好好聽】我們為什麼會做夢？",
  Cover: "https://i.scdn.co/image/ab6765630000ba8a7e082b260f898deae4a58b68",
  AudioQuestion: [
    {
      topic: "聽力大考驗",
      description: "在今天的節目裡，科學隊長說我們每天晚上都會經歷好幾個不同的睡眠階段。請問，我們通常是在哪一個睡眠階段做夢呢？",
      reference_answer: "我們主要是在「快速動眼期（REM）」做夢喔！在這個階段，我們的大腦非常活躍，就像我們醒著的時候一樣，所以才會出現各種奇妙的夢境。"
    }
  ],
  KeyTakeaway: [
    {
      emoji: "😴",
      content: "大腦的資源回收站：睡覺不是關機，而是在大掃除！"
    },
    {
      emoji: "🎥",
      content: "夢境是情緒的電影院：把白天發生的事情變成電影播放。"
    },
    {
      emoji: "💡",
      content: "創意來自白日夢？有時候最棒的想法，是剛睡醒的時候蹦出來的喔！"
    }
  ],
  FamilyDiscussion: {
    topic: "夢境分享大會",
    description: "如果可以自己決定今天晚上要做什麼夢，你最想夢到什麼呢？為什麼？",
    reference_answer: "可以夢到去外太空旅行、變成超級英雄，或者是吃不完的冰淇淋！這沒有標準答案，請爸爸媽媽跟孩子一起發揮想像力，分享彼此最想做的夢吧！"
  },
  Glossary: [
    { term: "快速動眼期 (REM)", explanation: "睡覺時眼球會快速轉動的階段，也是我們最容易做夢的時候。" },
    { term: "海馬迴", explanation: "大腦裡負責記憶的重要部位，形狀像一隻海馬喔！" }
  ]
};

async function seed() {
  console.log("Seeding Firestore...");
  const docRef = doc(db, "episodes", episodeData.id);
  await setDoc(docRef, episodeData);
  console.log("Episode seeded successfully with status 'published'!");
  process.exit(0);
}

seed().catch(console.error);
