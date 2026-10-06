const MARKDOWN_PATH = /\.(?:markdown|mdown|mkdn|md|mkd|mdwn|mdtxt|mdtext|text)$/i;

const VIEWER_CONFIG = {
    theme: 'github',
    raw: false,
    themes: {width: 'full'},
    compiler: 'markdown-it',
    content: {
        autoreload: false,
        emoji: true,
        mathjax: true,
        mermaid: true,
        syntax: true,
        toc: true,
    },
    custom: {theme: '', color: 'auto'},
    icon: 'default',
};

const VIEWER_SCRIPTS = [
    'vendor/mithril.min.js',
    'vendor/prism.min.js',
    'vendor/prism-autoloader.min.js',
    'content/prism.js',
    'content/emoji.js',
    'vendor/mermaid.min.js',
    'vendor/panzoom.min.js',
    'content/mermaid.js',
    'content/mathjax.js',
    'vendor/mathjax/tex-mml-chtml.js',
    'content/index.js',
    'content/scroll.js',
];

const isMarkdownUrl = (url) => {
    if (!url) return false;
    try {
        const parsed = new URL(url);
        return ['file:', 'http:', 'https:'].includes(parsed.protocol)
            && MARKDOWN_PATH.test(decodeURIComponent(parsed.pathname));
    } catch (_) {
        return false;
    }
};

const injectMarkdownViewer = async (tabId) => {
    const [{result: canInject}] = await chrome.scripting.executeScript({
        target: {tabId},
        func: (config) => {
            const pre = document.querySelector('body > pre');
            if (!pre || document.documentElement.dataset.surfingkeysMarkdownViewer) return false;
            document.documentElement.dataset.surfingkeysMarkdownViewer = 'loading';
            pre.style.visibility = 'hidden';
            globalThis.args = config;
            return true;
        },
        args: [VIEWER_CONFIG],
    });
    if (!canInject) return;
    await chrome.scripting.insertCSS({
        target: {tabId},
        files: ['content/index.css', 'content/themes.css'],
    });
    await chrome.scripting.executeScript({
        target: {tabId},
        files: VIEWER_SCRIPTS,
    });
    await chrome.scripting.executeScript({
        target: {tabId},
        func: () => {
            document.documentElement.dataset.surfingkeysMarkdownViewer = 'ready';
            document.dispatchEvent(new CustomEvent('surfingkeys:ensureFrontEnd'));
            document.dispatchEvent(new CustomEvent('surfingkeys:markdownViewerReady'));
        },
    });
};

const startMarkdownViewer = () => {
    importScripts(
        chrome.runtime.getURL('vendor/markdown-it.min.js'),
        chrome.runtime.getURL('background/compilers/markdown-it.js'),
        chrome.runtime.getURL('background/mathjax.js'),
    );
    const compilerState = {'markdown-it': globalThis.md.compilers['markdown-it'].defaults};
    const compiler = globalThis.md.compilers['markdown-it']({storage: {state: compilerState}});

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.status !== 'complete' || !isMarkdownUrl(tab.url)) return;
        injectMarkdownViewer(tabId).catch((error) => {
            console.error('[Surfingkeys Markdown Viewer]', error);
        });
    });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.message === 'markdown') {
            let source = request.markdown;
            const math = globalThis.md.mathjax()();
            source = math.tokenize(source);
            sendResponse({message: 'html', html: math.detokenize(compiler.compile(source))});
        } else if (request.message === 'autoreload') {
            fetch(request.location + '?preventCache=' + Date.now())
                .then((response) => response.text())
                .then((body) => sendResponse({body}))
                .catch((error) => sendResponse({err: String(error)}));
            return true;
        } else if (request.message === 'prism' || request.message === 'mathjax') {
            const path = request.message === 'prism'
                ? `vendor/prism/prism-${request.language}.min.js`
                : `vendor/mathjax/extensions/${request.extension}.js`;
            chrome.scripting.executeScript({target: {tabId: sender.tab.id}, files: [path]})
                .then(() => sendResponse({ok: true}))
                .catch((error) => sendResponse({err: String(error)}));
            return true;
        }
        return false;
    });
};

export default startMarkdownViewer;
