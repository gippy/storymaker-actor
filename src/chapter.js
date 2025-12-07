import { Actor, log } from 'apify';

import { writeChapterWithAI, updateChapterWithAI, createIllustrationForChapter } from './ai.js';
import { keyValueStoreUrl } from './consts.js';
import { prepareHtml } from './html.js';
import { updateStatus } from './status.js';

export const writtenChapters = {};
export const history = { chapterNumber: 0 };
const draftCounts = {};

async function processChapterFromAI(chapterText, chapter, series, illustrationModel) {
    await updateStatus({ seriesTitle: series.seriesTitle, writtenChapters, statusMessage: `Processing chapter ${chapter.number}`, isFinished: false });
    const draftNumber = (draftCounts[chapter.number] ?? 0) + 1;
    const draftChapterFileName = `draft-chapter-${chapter.number.toString().padStart(2, "0")}-${draftNumber.toString().padStart(2, "0")}`;
    const finalChapterFileName = `final-chapter-${chapter.number.toString().padStart(2, "0")}`;
    await Actor.setValue(`${draftChapterFileName}.txt`, chapterText, { contentType: 'text/plain' });
    await Actor.setValue(`${finalChapterFileName}.txt`, chapterText, { contentType: 'text/plain' });

    const draftJsonFileName = `${draftChapterFileName}.json`;
    const finalJsonFileName = `${finalChapterFileName}.json`;
    const chapterData = JSON.parse(chapterText);
    await Actor.setValue(draftJsonFileName, chapterData);
    await Actor.setValue(finalJsonFileName, chapterData);

    log.info('Generated chapter', { name: chapterData.chapterName, url: `${keyValueStoreUrl}/${draftJsonFileName}` });

    log.info('Generating illustration');
    const imageBuffers = await createIllustrationForChapter({
        ...series,
        illustrationModel,
        chapterSummary: chapterData.summary,
        chapterIllustrationDescription: chapterData.illustration
    });

    const draftIllustrationFileName = `${draftChapterFileName}.png`;
    const finalIllustrationFileName = `${finalChapterFileName}.png`;
    const buffer = imageBuffers[0];
    await Actor.setValue(draftIllustrationFileName, buffer, { contentType: 'image/png' });
    await Actor.setValue(finalIllustrationFileName, buffer, { contentType: 'image/png' });

    log.info(`Generated illustration`, { url: `${keyValueStoreUrl}/${draftIllustrationFileName}` });

    log.info('Generating html');
    const draftHtmlFileName = `${draftChapterFileName}.html`;
    const finalHtmlFileName = `${finalChapterFileName}.html`;
    const draftFullChapterHtml = prepareHtml(series.seriesTitle, chapterData, `${keyValueStoreUrl}/${draftIllustrationFileName}`);
    const finalFullChapterHtml = prepareHtml(series.seriesTitle, chapterData, `${keyValueStoreUrl}/${finalIllustrationFileName}`);
    await Actor.setValue(draftHtmlFileName, draftFullChapterHtml, { contentType: 'text/html' });
    await Actor.setValue(finalHtmlFileName, finalFullChapterHtml, { contentType: 'text/html' });
    log.info('Generated html', { url: `${keyValueStoreUrl}/${draftHtmlFileName}` });

    const result = {
        chapterNumber: chapter.number,
        ...chapterData,
        htmlUrl: `${keyValueStoreUrl}/${draftHtmlFileName}`,
        illustrationUrl: `${keyValueStoreUrl}/${draftIllustrationFileName}`,
        draftNumber,
    }

    await Actor.pushData(result);

    result.htmlFileName = finalHtmlFileName;
    result.html = finalFullChapterHtml;
    result.jsonFileName = finalJsonFileName;
    result.json = chapterData;
    result.illustrationFileName = finalIllustrationFileName;
    result.imageBuffer = buffer;

    writtenChapters[chapter.number] = result;
    draftCounts[chapter.number] = draftNumber;

    await updateStatus({ seriesTitle: series.seriesTitle, writtenChapters, statusMessage: `Finished generating chapter ${chapter.number}`, isFinished: false });

    return result;
}

export async function writeNewChapter(series, textModel, illustrationModel, retry = false) {
    try {
        const nextChapterNumber = Math.max(history.chapterNumber, ...Object.keys(writtenChapters)) + 1;
        const chapter = {
            number: nextChapterNumber,
        };
        log.info('Generating chapter', { number: chapter.number });

        await updateStatus({ seriesTitle: series.seriesTitle, writtenChapters, statusMessage: `Generating ${chapter.number}`, isFinished: false });
        let chapterText = await writeChapterWithAI(chapter, textModel, retry);
        return await processChapterFromAI(chapterText, chapter, series, illustrationModel);
    } catch (error) {
        if (error.data?.invalidItems) {
            // Here we log separate exception for each item which failed validation, but you can handle it any way you want
            error.data.invalidItems.forEach((item) => {
                const { validationErrors } = item;
                log.exception(error, 'Failed to properly generate chapter due to validation error', { validationErrors });
            });
        } else {
            log.exception(error, 'Failed to properly generate chapter', { willRetry: !!retry });
        }
        // The AI can create random stuff, let's try again if we failed to parse/store the chapter data
        if (!retry) return writeNewChapter(series, textModel, illustrationModel, true);
        else throw error;
    }
}

export async function writeChapter(series, chapter, textModel, illustrationModel, retry = false) {
    try {
        log.info('Generating chapter', { number: chapter.number });
        await updateStatus({ seriesTitle: series.seriesTitle, writtenChapters, statusMessage: `Generating ${chapter.number}`, isFinished: false });

        let chapterText = await writeChapterWithAI(chapter, textModel, retry);
        return await processChapterFromAI(chapterText, chapter, series, illustrationModel);
    } catch (error) {
        if (error.data?.invalidItems) {
            // Here we log separate exception for each item which failed validation, but you can handle it any way you want
            error.data.invalidItems.forEach((item) => {
                const { validationErrors } = item;
                log.exception(error, 'Failed to properly generate chapter due to validation error', { validationErrors });
            });
        } else {
            log.exception(error, 'Failed to properly generate chapter', { willRetry: !!retry });
        }
        // The AI can create random stuff, let's try again if we failed to parse/store the chapter data
        if (!retry) return writeChapter(series, chapter, textModel, illustrationModel, true);
        else throw error;
    }
}

export async function updateChapter(series, chapter, textModel, illustrationModel, retry = false) {
    try {
        log.info('Updating chapter', { number: chapter.number });
        await updateStatus({ seriesTitle: series.seriesTitle, writtenChapters, statusMessage: `Generating ${chapter.number}`, isFinished: false });

        let chapterText = await updateChapterWithAI(chapter, textModel, retry);
        return await processChapterFromAI(chapterText, chapter, series, illustrationModel);
    } catch (error) {
        if (error.data?.invalidItems) {
            // Here we log separate exception for each item which failed validation, but you can handle it any way you want
            error.data.invalidItems.forEach((item) => {
                const { validationErrors } = item;
                log.exception(error, 'Failed to properly generate chapter due to validation error', { validationErrors });
            });
        } else {
            log.exception(error, 'Failed to properly generate chapter', { willRetry: !!retry });
        }
        // The AI can create random stuf, let's try again if we failed to parse/store the chapter data
        if (!retry) return updateChapter(series, chapter, textModel, illustrationModel, true);
        else throw error;
    }
}

