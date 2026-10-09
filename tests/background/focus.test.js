import {shouldBlockUrl, startFocusBlocking} from '../../src/background/focus.js';

describe('网站拦截边界', () => {
    test.each([
        ['https://www.bilibili.com/', true],
        ['https://www.bilibili.com/video/BV123', true],
        ['https://www.bilibili.com/read/cv123', true],
        ['https://m.bilibili.com/', true],
        ['https://www.zhihu.com/question/123', true],
        ['https://zhuanlan.zhihu.com/p/123', false],
        ['https://music.youtube.com/watch?v=123', false],
        ['https://www.youtube.com/watch?v=123', true],
        ['https://bilibili.com.example.org/', false],
        ['https://notbilibili.com/', false],
        ['https://example.org/?url=bilibili.com', false],
        ['file:///D:/notes.md', false],
        ['chrome://extensions/', false],
        ['invalid', false],
    ])('%s → %s', (url, expected) => {
        expect(shouldBlockUrl(url)).toBe(expected);
    });

    test('已打开页面与站内跳转受拦截，允许的页面保留', () => {
        let listener;
        global.chrome = {
            runtime: {getURL: (path) => `chrome-extension://test/${path}`},
            tabs: {
                update: jest.fn(),
                onUpdated: {addListener: (callback) => {listener = callback;}},
                query: (_, callback) => callback([
                    {id: 1, url: 'https://www.bilibili.com/'},
                    {id: 2, url: 'https://music.youtube.com/'},
                ]),
            },
        };
        startFocusBlocking();
        listener(3, {url: 'https://www.zhihu.com/'}, {id: 3, url: 'https://www.zhihu.com/'});
        expect(chrome.tabs.update.mock.calls).toEqual([
            [1, {url: 'chrome-extension://test/pages/focus.html?site=bilibili.com'}],
            [3, {url: 'chrome-extension://test/pages/focus.html?site=zhihu.com'}],
        ]);
        delete global.chrome;
    });
});
