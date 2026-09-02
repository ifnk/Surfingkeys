describe('Mode special keys', () => {
    test('treats Ctrl-[ exactly like Escape', () => {
        global.chrome = {
            runtime: {
                onMessage: {addListener: jest.fn()},
                sendMessage: jest.fn(),
            }
        };
        const KeyboardUtils = require('src/content_scripts/common/keyboardUtils.js').default;
        const Mode = require('src/content_scripts/common/mode.js').default;
        const ctrlBracket = KeyboardUtils.encodeKeystroke('<Ctrl-[>');

        expect(Mode.isSpecialKeyOf('<Esc>', ctrlBracket)).toBe(true);
    });
});
