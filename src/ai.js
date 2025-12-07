import OpenAI from "openai";

// Create OpenRouter (via Apify Actor gateway)
const openai = new OpenAI({
    baseURL: "https://openrouter.apify.actor/api/v1",
    apiKey: "no-key-required-but-must-not-be-empty",
    defaultHeaders: {
        Authorization: `Bearer ${process.env.APIFY_TOKEN}`,
    },
});

//
// 1. Write Chapter with AI (OpenRouter)
//
export async function writeChapterWithAI({
    seriesTitle,
    seriesGenre,
    seriesDescription,
    mainCharacterDescription,
    additionalCharacters,
    chapter,
}) {
    const systemInstruction = `
You are an accomplished shadow writer and your role is to provide support to flesh out ideas 
for new chapters in a web series called ${seriesTitle}.

The series is in ${seriesGenre} genre and is about:
${seriesDescription}

The main character of the book can be described like this:
${mainCharacterDescription}

In addition to main character, the series has following other important existing characters:
${additionalCharacters}

Each chapter in the series will at most be around 2000 words long.

The book is written in a specific format and it's your role to write the content of the book 
while keeping the format consistent.

Each chapter of the book must always include:

* Short introduction text (quote from a person related to the protagonist, from the future)
* Attribution (name of the quoted person)
* Body of the chapter
* Illustration description (detailed, standalone image prompt)
* Author's note
* Summary

You will receive instructions in this exact format:
**Chapter number:** <number>
**Chapter description:** <one line>

Your task is to write the chapter and output ONLY valid JSON in this format:
{
  chapterName: { type: "string" },
  introduction: { type: "string" },
  attribution: { type: "string" },
  body: { type: "string" },
  illustration: { type: "string" },
  note: { type: "string" },
  summary: { type: "string" }
}

Do NOT use \`\`\` anywhere.
All text except illustration + summary must be Markdown.`;

    const userMessage = `
**Chapter number:** ${chapter.number}
**Chapter description:** ${chapter.description}`;

    const response = await openai.chat.completions.create({
        model: "google/gemini-2.5-flash",
        messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: userMessage },
        ],
    });

    let output = response.choices[0].message.content || "";
    
    output = output.replace(/```json/g, "").split("```")[0];

    return output;
}

//
// 2. Create Illustration for Chapter (OpenRouter)
//
export async function createIllustrationForChapter({
    seriesTitle,
    seriesGenre,
    seriesDescription,
    mainCharacterDescription,
    additionalCharacters,
    chapterSummary,
    chapterIllustrationDescription,
}) {
    const prompt = `Create an illustration for the chapter in a series titled "${seriesTitle}".
The illustration must NOT contain any text inside the image.

Series genre: ${seriesGenre}

Series description:
${seriesDescription}

Main character:
${mainCharacterDescription}

Additional characters:
${additionalCharacters}

Chapter summary:
${chapterSummary}

The illustration should look like this:
${chapterIllustrationDescription}`;

    const response = await openai.chat.completions.create({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
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