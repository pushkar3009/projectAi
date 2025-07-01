import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "aipr", // Unique app ID
  name: "aipr",
  credentials: {
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
    },
  },
});