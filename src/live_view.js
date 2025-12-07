import { containerUrl } from './consts.js';
import { writtenChapters } from './chapter.js';
import { convertToHtml } from './html.js';
import { status } from './status.js';

export function chapterHtml(chapter) {
    return `
        <section>
            <header>
                <h2>${chapter.chapterName}</h2>
            </header>
            <div class="content">
                <main>
                    <blockquote>
                        ${convertToHtml(chapter.introduction)}

                        <p>${chapter.attribution}</p>
                    </blockquote>
                    <hr>
                    ${convertToHtml(chapter.body)}
                    <br />
                    <img src="${chapter.illustrationUrl}" alt="chapter illustration" />
                </main>
                <footer>
                    <p>Authors note:</p>
                    ${convertToHtml(chapter.note)}
                </footer>
            </div>
        </section>
    `;
}

export async function getStatus({ seriesTitle }) {
    let chaptersHtml = Object.keys(writtenChapters).sort((a,b) => b > a).map((key) => chapterHtml(writtenChapters[key])).join('\n');
    return `<html>
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>${seriesTitle}</title>
        <style>
            :root{--bg:#f6f7fb;--card:#ffffff;--accent:#6a5cff;--muted:#6b7280;--maxw:900px}
            html,body{height:100%}
            body{font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial;background:var(--bg);color:#111827;line-height:1.6;padding:24px;display:flex;justify-content:center}
            .container{width:100%;max-width:var(--maxw)}
            .status,.api-information,.download-link{background:var(--card);padding:12px 16px;border-radius:10px;box-shadow:0 1px 2px rgba(16,24,40,.05);margin-bottom:12px}
            .status p{margin:0;font-weight:600;color:var(--accent)}
            .api-information a{color:var(--accent);text-decoration:none;word-break:break-all}
            section{background:var(--card);border-radius:12px;padding:0;margin:14px 0;box-shadow:0 6px 18px rgba(15,23,42,0.06);overflow:hidden;border:1px solid rgba(15,23,42,0.04)}
            section header{padding:16px 20px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:12px;background:linear-gradient(90deg, rgba(106,92,255,0.06), rgba(106,92,255,0.02));border-bottom:1px solid rgba(15,23,42,0.03)}
            section header::before{content:"";width:6px;height:36px;background:var(--accent);border-radius:4px;margin-right:12px;display:inline-block;flex-shrink:0;box-shadow:0 2px 6px rgba(106,92,255,0.08)}
            section header h2{margin:0;font-size:1.125rem;font-weight:600;letter-spacing:0.2px}
            section .content{padding:0 20px 18px 20px;transition:max-height .32s ease,opacity .2s ease;overflow:hidden}
            section footer{background:transparent;padding:12px 20px;border-top:1px solid rgba(15,23,42,0.03);color:var(--muted)}
            section img{display:block;max-width:100%;height:auto;border-radius:8px;margin-top:12px}
            .chev{width:20px;height:20px;display:inline-block;transform:rotate(90deg);transition:transform .2s ease;flex-shrink:0}
            section.collapsed header .chev{transform:rotate(-90deg)}
            @media (max-width:640px){body{padding:14px} section header h2{font-size:1rem}}
            /* subtle content formatting inside chapters */
            blockquote{border-left:3px solid rgba(99,102,241,.12);padding-left:12px;color:var(--muted);margin:12px 0}
            code{background:#f3f4f6;padding:2px 6px;border-radius:6px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,monospace}
            /* auto-refresh warning/info box */
            .top-row{display:flex;gap:12px;align-items:stretch}
            /* allow the status to grow and take remaining space, keep the warning a bounded box */
            .top-row .status{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;justify-content:center;padding:12px 14px}
            /* Status heading + message styling */
            .status h3{margin:0;color:var(--muted);font-size:0.85rem;font-weight:600;text-transform:uppercase;letter-spacing:0.6px}
            .status p{margin:0;margin-top:6px;font-size:1.05rem;font-weight:700;color:var(--accent)}
            .auto-refresh-warning{display:flex;align-items:center;gap:12px;background:linear-gradient(90deg, rgba(96,165,250,0.08), rgba(96,165,250,0.03));border:1px solid rgba(96,165,250,0.18);color:#0f172a;padding:12px 14px;border-radius:10px;margin-bottom:12px;position:relative;max-height:220px;transition:opacity .28s ease,max-height .32s ease,transform .18s ease;flex:0 0 auto;max-width:400px}
            .auto-refresh-warning p{margin:0;padding:0;flex:1;color:#0f172a}
            .auto-refresh-warning img.auto-refresh{height:100px;width:auto;object-fit:contain;opacity:.95;border:2px solid #374151;border-radius:6px}
            /* Float the close button partly outside the warning so it doesn't obscure the image */
            .auto-refresh-warning .auto-refresh-close{position:absolute;top:-10px;right:-10px;background:#ffffff;border:1px solid rgba(15,23,42,0.06);color:var(--muted);font-size:18px;line-height:1;padding:8px;cursor:pointer;border-radius:10px;box-shadow:0 8px 22px rgba(15,23,42,0.10);z-index:8;display:inline-flex;align-items:center;justify-content:center;min-width:40px;min-height:40px}
            .auto-refresh-warning .auto-refresh-close:hover{background:#f3f4f6}
            @media (max-width:520px){
                .auto-refresh-warning .auto-refresh-close{top:6px;right:6px;transform:translate(0,0);}
            }
            </style>
    </head>
    <body>
        <div class="container">
            <div class="top-row">
                <div class="status">
                    <h3>Current status:</h3>
                    <p>${status.message}</p>
                </div>
            </div>
            <div class="api-information">
                <p>API is available at: <a href="${containerUrl}">${containerUrl}</a></p>
            </div>
            <!-- Controls inserted under the top row/status area -->
            <div class="controls" style="margin-bottom:12px;display:flex;gap:8px;align-items:center">
                <button id="refresh-btn" aria-label="Refresh chapters and status" style="background:var(--accent);color:white;border:0;padding:8px 12px;border-radius:8px;cursor:pointer">Refresh</button>
                <button id="new-chapter-btn" aria-label="Create new chapter" style="background:#10b981;color:white;border:0;padding:8px 12px;border-radius:8px;cursor:pointer">New chapter</button>
                <button id="exit-btn" aria-label="Exit interactive mode" style="background:#ef4444;color:white;border:0;padding:8px 12px;border-radius:8px;cursor:pointer">Exit</button>
                <div id="last-updated" style="color:var(--muted);font-size:0.9rem">Last updated: never</div>
            </div>

            ${chaptersHtml}
        </div>
        
        <script>
            // Utility: initialize collapsible chapter sections (runs after chapters HTML is injected)
            function initChapters() {
                // remove any previously attached handlers by cloning container
                const container = document.querySelector('.container');
                if(!container) return;

                const sections = Array.from(container.querySelectorAll('section'));
                sections.forEach((sec, idx) => {
                    const header = sec.querySelector('header');
                    const content = sec.querySelector('.content');
                    const main = sec.querySelector('main');
                    if(!header || !main || !content) return;

                    // ensure no duplicate chevrons
                    if(!header.querySelector('.chev')){
                        const chev = document.createElement('span');
                        chev.className = 'chev';
                        chev.setAttribute('aria-hidden','true');
                        chev.textContent = '▾';
                        header.appendChild(chev);
                    }

                    const mainId = 'chapter-main-' + idx;
                    content.id = mainId;
                    header.setAttribute('role','button');
                    header.setAttribute('tabindex','0');
                    header.setAttribute('aria-controls', mainId);
                    header.setAttribute('aria-expanded','false');
                    sec.classList.add('collapsed');

                    // Initialize collapsed state
                    content.style.maxHeight = '0px';
                    content.style.opacity = '0';
                    content.style.display = 'block';

                    function collapse(shouldClose){
                        const isOpen = header.getAttribute('aria-expanded') === 'true';
                        const willOpen = (typeof shouldClose === 'boolean') ? !shouldClose : !isOpen;
                        if(willOpen){
                            sec.classList.remove('collapsed');
                            header.setAttribute('aria-expanded','true');
                            const sh = content.scrollHeight;
                            content.style.display = '';
                            requestAnimationFrame(()=>{
                                content.style.maxHeight = sh + 'px';
                                content.style.opacity = '1';
                            });
                        } else {
                            header.setAttribute('aria-expanded','false');
                            sec.classList.add('collapsed');
                            const curH = content.scrollHeight;
                            content.style.maxHeight = curH + 'px';
                            requestAnimationFrame(()=>{
                                content.style.maxHeight = '0px';
                                content.style.opacity = '0';
                            });
                        }
                    }

                    header.addEventListener('click', ()=> collapse());
                    header.addEventListener('keydown', (e)=>{
                        if(e.key === 'Enter' || e.key === ' '){
                            e.preventDefault();
                            collapse();
                        }
                    });
                });
            }

            // Fetch status and chapters from /status and update the page
            async function loadStatus(){
                const statusP = document.querySelector('.status p');
                const lastUpdated = document.getElementById('last-updated');
                const refreshBtn = document.getElementById('refresh-btn');

                if(refreshBtn) refreshBtn.disabled = true;
                try {
                    const resp = await fetch('/status', {cache: 'no-store'});
                    if(!resp.ok) throw new Error('Network response was not ok: ' + resp.status);
                    const data = await resp.json();

                    if(statusP && typeof data.statusMessage === 'string'){
                        statusP.textContent = data.statusMessage;
                    }

                    if(data.chapters && typeof data.chapters === 'string'){
                        // Replace existing sections container contents with server provided chapters HTML
                        // Find the first section element parent context and replace all sections inside container
                        const container = document.querySelector('.container');
                        if(container){
                            // Remove existing sections
                            const existingSections = Array.from(container.querySelectorAll('section'));
                            existingSections.forEach(s=>s.parentNode && s.parentNode.removeChild(s));

                            // Create a temporary wrapper to parse the chapters HTML
                            const tmp = document.createElement('div');
                            tmp.innerHTML = data.chapters;
                            // Append the nodes (only section elements to keep structure predictable)
                            const newSections = Array.from(tmp.querySelectorAll('section'));
                            if(newSections.length){
                                newSections.forEach(ns => container.appendChild(ns));
                            } else {
                                // If the server returned full markup without section tags, append raw HTML
                                const frag = document.createRange().createContextualFragment(data.chapters);
                                container.appendChild(frag);
                            }

                            // Re-initialize chapter behavior
                            initChapters();
                        }
                    }

                    if(lastUpdated) lastUpdated.textContent = 'Last updated: ' + (new Date()).toLocaleString();
                } catch (err) {
                    console.error('Failed to load status:', err);
                    if(statusP) statusP.textContent = 'Error loading status';
                    if(lastUpdated) lastUpdated.textContent = 'Last updated: error';
                } finally {
                    if(refreshBtn) refreshBtn.disabled = false;
                }
            }

            // Wire buttons and initial load
            (function(){
                const refreshBtn = document.getElementById('refresh-btn');
                if(refreshBtn) refreshBtn.addEventListener('click', ()=> loadStatus());

                const exitBtn = document.getElementById('exit-btn');
                async function exitActor(){
                    if(!exitBtn) return;
                    if(!confirm('Are you sure you want to exit?')) return;
                    exitBtn.disabled = true;
                    exitBtn.textContent = 'Exiting...';
                    try {
                        await fetch('/exit');
                        document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100%;flex-direction:column"><h1>Actor finished</h1></div>';
                    } catch (err){
                        console.error('Failed to exit:', err);
                        alert('Failed to exit: ' + err.message);
                        exitBtn.disabled = false;
                        exitBtn.textContent = 'Exit';
                    }
                }
                if(exitBtn) exitBtn.addEventListener('click', exitActor);

                const newChapterBtn = document.getElementById('new-chapter-btn');
                async function createChapter(){
                    if(!newChapterBtn) return;
                    newChapterBtn.disabled = true;
                    const oldText = newChapterBtn.textContent;
                    newChapterBtn.textContent = 'Creating...';
                    try {
                        const resp = await fetch('/', {method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({})});
                        if(!resp.ok) throw new Error('Create failed: ' + resp.status);
                        // Optionally read response (ignored here)
                        // const result = await resp.json();
                        // Refresh page data
                        await loadStatus();
                    } catch (err){
                        console.error('Failed to create chapter:', err);
                        alert('Failed to create chapter: ' + err.message);
                    } finally {
                        newChapterBtn.disabled = false;
                        newChapterBtn.textContent = oldText;
                    }
                }
                if(newChapterBtn) newChapterBtn.addEventListener('click', createChapter);

                // Initial load
                document.addEventListener('DOMContentLoaded', ()=>{
                    // run initial init for any inline sections present before server response
                    initChapters();
                    loadStatus();
                });
            })();
        </script>
    </body>
</html>`;
}