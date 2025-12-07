import OpenAI from "openai";
import { Actor } from "apify";

// Create OpenAI client using OpenRouter on Apify
const openai = new OpenAI({
    baseURL: "https://openrouter.apify.actor/api/v1",
    apiKey: "no-key-required-but-must-not-be-empty",
    defaultHeaders: {
        Authorization: `Bearer ${process.env.APIFY_TOKEN}`,
    },
});

// Chat state
let history = [];
let systemInstruction = "";
let messageCount = 0;

// Create system prompt (formerly ai.chats.create)
export async function createChat({
    seriesTitle,
    seriesGenre,
    seriesDescription,
    mainCharacterDescription,
    additionalCharacters,
    textModel = "google/gemini-2.5-flash",
}) {
    systemInstruction = `
    You are an accomplished shadow writer and your role is to provide support to flash out ideas 
    for new chapters in a web series called ${seriesTitle}.
    The series is in ${seriesGenre} genre and is about:
    ${seriesDescription}

    The main character of the book can be described like this:
    ${mainCharacterDescription}

    In addition to main character, the series has following other important existing characters:
    ${additionalCharacters || "None"}

    The book is written in a specific format and it's your role to write the content of the book 
    while keeping the format consistent.

    Each chapter of the book should always have:
    
    * Short introduction text
    * Attribution (the person the quote is attributed to)
    * Text of the chapter
    * Illustration description
    * Author's note
    * Summary

    You will receive instructions for each chapter written in 3 possible formats:

    1. New chapter with full description
    2. New chapter without description
    3. Update to previously created chapter

    Output MUST always be JSON in this exact format:
    {
        chapterName: { type: "string" }, 
        introduction: { type: "string" },
        attribution: { type: "string" },
        body: { type: "string" },
        illustration: { type: "string" },
        note: { type: "string" },
        summary: { type: "string" }
    }

    Do NOT use "\`\`\`" anywhere.`;

    // Reset chat state when a new chat is created
    history = [];
    messageCount = 0;
}

// Generic function to send a message to the model
async function sendAIMessage(message, textModel) {
    const response = await openai.chat.completions.create({
        model: textModel,
        messages: [
            { role: "system", content: systemInstruction },
            ...history,
            { role: "user", content: message },
        ],
    });

    const text = response.choices[0].message.content;

    // update conversation history
    history.push({ role: "user", content: message });
    history.push({ role: "assistant", content: text });

    return text;
}

export async function writeChapterWithAI(chapter, textModel, retry) {
    messageCount++;

    const message = `${retry
        ? "I could not parse your answer. Send the chapter again, but make sure to create just one chapter and output it in correct format."
        : ""
        }
**Chapter number:** ${chapter.number}
**Chapter description:** ${chapter.description ?? ""}`;

    const text = await sendAIMessage(message, textModel);

    const requestWithResponse = `Message:
${message}

Response:
${text}`;

    await Actor.setValue(
        `communication-${messageCount.toString().padStart(3, "0")}.txt`,
        requestWithResponse,
        { contentType: "text/plain" }
    );

    return text.replace(/```json/g, "").split("```")[0];
}

export async function updateChapterWithAI(chapter, textModel, retry) {
    messageCount++;

    const message = `${retry
        ? "I could not parse your answer. Send the chapter again, but make sure to create just one chapter and output it in correct format."
        : ""
        }
**Chapter number:** ${chapter.number}
**Update request:** ${chapter.updateRequest}`;

    const text = await sendAIMessage(message, textModel);

    const requestWithResponse = `Message:
${message}

Response:
${text}`;

    await Actor.setValue(
        `communication-${messageCount.toString().padStart(3, "0")}.txt`,
        requestWithResponse,
        { contentType: "text/plain" }
    );

    return text.replace(/```json/g, "").split("```")[0];
}

export async function createIllustrationForChapter({
    seriesTitle,
    seriesGenre,
    seriesDescription,
    mainCharacterDescription,
    additionalCharacters,
    chapterSummary,
    chapterIllustrationDescription,
    illustrationModel = "google/gemini-2.5-flash-image",
}) {
    const prompt = `
Create an illustration for the chapter in a series titled ${seriesTitle}.
The illustration should not contain any text inside the image.

Series genre: ${seriesGenre}
Series description:
${seriesDescription}

Main character:
${mainCharacterDescription}

Additional characters:
${additionalCharacters}

The chapter summary:
${chapterSummary}

The illustration should look like this:
${chapterIllustrationDescription}
`;

    const response = await openai.chat.completions.create({
        model: illustrationModel,
        messages: [
            { role: "user", content: prompt }
        ],
        modalities: ["text", "image"],

    });

    const buffers = [];

    const images = response.choices?.[0]?.message?.images ?? [];

    for (const img of images) {
        if (img.type === "image_url" && img.image_url?.url) {
            const base64 = img.image_url.url.replace(/^data:image\/\w+;base64,/, "");
            buffers.push(Buffer.from(base64, "base64"));
        }
    }

    return buffers;

}