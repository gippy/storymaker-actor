# Storymaker Actor

Storymaker Actor is an AI-powered tool designed to help you write and illustrate web series. It acts as a "shadow writer," fleshing out your ideas into full chapters complete with introductions, attributions, author's notes, summaries, and AI-generated illustrations.

## Features

* **AI Writing**: Generates consistent chapter content based on your series description and characters.
* **AI Illustration**: Creates unique illustrations for each chapter using image generation models.
* **Interactive Mode**: A web-based interface (Live View) to generate, review, and update chapters in real-time.
* **History Management**: Save your story progress to a named storage and continue writing in future runs.
* **Customizable Models**: Choose your preferred AI models for both text (e.g., Gemini, GPT, Claude) and image generation.

## Usage

You can run this Actor on the [Apify Platform](https://apify.com).

### Input Configuration

The Actor takes the following main inputs:

* **Series Details**: Title, Genre, and Description of your web series.
* **Characters**: Descriptions of the Main Character and Additional Characters.
* **Chapters**: An initial list of chapters to generate immediately.
* **Interactive Mode**: Check this box to enable the web server and API for dynamic story creation.
* **AI Models**: Select the specific models you want to use for text and illustrations.
* **Chapter History**: Provide a name (e.g., `my-story-storage`) to save/load context. This allows you to continue a story over multiple Actor runs.

### Modes of Operation

#### 1. Batch Mode

If `Interactive Mode` is **disabled**, the Actor will:

1. Load any existing history (if configured).
2. Generate the chapters specified in the `Chapters` input array.
3. Save the results and exit.

#### 2. Interactive Mode

If `Interactive Mode` is **enabled**, the Actor will:

1. Load history and generate initial chapters (same as Batch Mode).
2. Start a web server and keep the Actor running.
3. Expose a **Live View** URL where you can see the generated story.

**In Interactive Mode, you can:**

* **View Status**: See all generated chapters rendered in a nice HTML format.
* **Create New Chapters**: Click the "New chapter" button to generate the next chapter automatically.
* **Refresh**: Update the view to see the latest progress.
* **Exit**: Click "Exit" to save your work and stop the Actor.

### API Endpoints (Interactive Mode)

When running in interactive mode, you can also control the Actor via its container URL API:

* **`GET /`**: Returns the Interactive Status Page (HTML).
* **`GET /status`**: Returns the current status and chapters as JSON.
* **`POST /`**: Triggers generation of the next sequential chapter.
* **`POST /chapter/:chapterNumber`**: Generates (or regenerates) a specific chapter.
  * Body: `{ "description": "Optional prompt for this chapter" }`
* **`PUT /chapter/:chapterNumber`**: Updates an existing chapter based on your feedback.
  * Body: `{ "message": "Please make the ending more dramatic." }`
* **`GET /exit`**: Stops the interactive server, saves all data to the history storage (if configured), and finishes the run.

## Output

The Actor stores its output in the default Key-Value Store and Dataset:

* **Dataset**: Contains the structured JSON data for each generated chapter.
* **Key-Value Store**:
  * `final-chapter-XX.html`: Full HTML render of the chapter.
  * `final-chapter-XX.png`: The AI-generated illustration.
  * `final-chapter-XX.json`: Raw JSON data.
  * `draft-chapter-...`: Intermediate drafts created during generation.

## Tips

* **Context is Key**: The more detailed your series and character descriptions, the better the AI can maintain consistency.
* **Iterate**: Use Interactive Mode to refine chapters. If a chapter isn't right, you can regenerate it or send update requests until it fits your vision.
* **Long Stories**: Use the `Chapter History` feature to build long-running series without hitting timeout limits. Just provide the same storage name in the next run to pick up where you left off.
