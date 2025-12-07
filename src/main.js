import { Actor, log } from 'apify';
import express from 'express';

import { createChat } from './ai.js';
import { writeNewChapter, writeChapter, updateChapter, writtenChapters, history } from './chapter.js';
import { containerUrl } from './consts.js';
import { getStatus, chapterHtml } from './live_view.js';
import { updateStatus, status } from './status.js';

await Actor.init();

const {
    seriesTitle,
    seriesGenre,
    seriesDescription,
    mainCharacterDescription,
    additionalCharacters,
    chapters,
    interactiveMode,
    textModel,
    illustrationModel,
    chapterHistoryStorageName,
} = await Actor.getInput();

const series = {
    seriesTitle,
    seriesGenre,
    seriesDescription,
    mainCharacterDescription,
    additionalCharacters,
};

let chapterHistorySharedDataset;
let chapterHistorySharedKeyValueStore;
let chapterHistory;
if (chapterHistoryStorageName) {
    chapterHistorySharedDataset = await Actor.openDataset(chapterHistoryStorageName);
    chapterHistorySharedKeyValueStore = await Actor.openKeyValueStore(chapterHistoryStorageName);

    chapterHistory = await chapterHistorySharedDataset.getData();
    if (chapterHistory.items.length > 0) {
        log.info('Loaded chapter history from shared dataset', { chapterCount: seriesChapterHistory.length });
    }
    history.chapterNumber = chapterHistory.items.reduce((max, item) => item.chapterNumber > max ? item.chapterNumber : max, 0);
}

await createChat({
    seriesTitle,
    seriesGenre,
    seriesDescription,
    mainCharacterDescription,
    additionalCharacters,
    chapterHistory,
});

for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i]
    await writeChapter(series, chapter, textModel, illustrationModel);
}

let isInteractiveModeOn = false;

async function finish() {
    isInteractiveModeOn = false;
    if (chapterHistorySharedDataset && chapterHistorySharedKeyValueStore) {
        log.info('Storing new chapters to shared storage');
    
        await updateStatus({ 
            seriesTitle: series.seriesTitle, 
            writtenChapters, 
            statusMessage: `Storing chapters to shared storage`, 
            isInteractiveModeOn, 
            isFinished: true
        });
        
        const keys = Object.keys(writtenChapters).sort((a,b) => a - b);
        const historyToStore = [];
        for (let i = 0; i < keys.length; i++) {
            const chapter = writtenChapters[keys[i]];
            historyToStore.push({
                chapterNumber: chapter.chapterNumber,
                summary: chapter.summary,
            });
            await chapterHistorySharedKeyValueStore.setValue(chapter.htmlFileName, chapter.html, { contentType: 'text/html' });
            await chapterHistorySharedKeyValueStore.setValue(chapter.jsonFileName, chapter.json);
            await chapterHistorySharedKeyValueStore.setValue(chapter.illustrationFileName, chapter.imageBuffer, { contentType: 'image/png' });
        }
        await chapterHistorySharedDataset.pushData(historyToStore);
        log.info('Stored chapter history to shared dataset and key-value store');
    }

    await updateStatus({ seriesTitle: series.seriesTitle, writtenChapters, statusMessage: `Finished`, isInteractiveModeOn, isFinished: true });
    await Actor.exit();
}

if (interactiveMode) {
    const app = express();
    app.use(express.json());

    app.get('/', async (req, res) => {
        const html = await getStatus({ seriesTitle });
        res.send(html);
    });

    app.get('/status', async (req, res) => {
        let chaptersHtml = Object.keys(writtenChapters).sort((a,b) => b > a).map((key) => chapterHtml(writtenChapters[key])).join('\n');
        res.send({
            statusMessage: status.message,
            chapters: chaptersHtml,
        });
    });

    app.post('/', async (req, res) => {
        log.info('Received next chapter request');
        const data = await writeNewChapter(series, textModel, illustrationModel);
        res.send(data);
    });

    app.post('/chapter/:chapterNumber', async (req, res) => {
        const chapterData = {
            number: parseInt(req.params.chapterNumber, 10),
            ...req.body,
        };
        log.info('Received new chapter data', chapterData);
        const data = await writeChapter(series, chapterData, textModel, illustrationModel);
        res.send(data);
    });

    app.put('/chapter/:chapterNumber', async (req, res) => {
        const chapterData = {
            number: parseInt(req.params.chapterNumber, 10),
            updateRequest: req.body.message,
        };
        const data = await updateChapter(series, chapterData, textModel, illustrationModel);
        res.send(data);
    });

    app.get('/exit', async (req, res) => {
        log.info('Received exit command, stopping interactive mode');
        res.send({ status: 'ok', message: 'Exiting...' });
        await finish();
    })

    const port = process.env.ACTOR_WEB_SERVER_PORT;
    app.listen(port, async () => {
        log.info('Interactive mode API started', { url: containerUrl });
        isInteractiveModeOn = true;
        await updateStatus({ seriesTitle: series.seriesTitle, writtenChapters, statusMessage: `Interactive mode started`, isInteractiveModeOn: isInteractiveModeOn, isFinished: false });
    });
}

if (!interactiveMode) {
    await finish();
}