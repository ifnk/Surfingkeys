import createClipboard from '../../src/content_scripts/common/clipboard';
import { showBanner } from '../../src/content_scripts/common/utils';

jest.mock('../../src/content_scripts/common/runtime', () => ({ RUNTIME: jest.fn() }));
jest.mock('../../src/content_scripts/common/utils', () => ({
    actionWithSelectionPreserved: cb => cb(),
    getBrowserName: () => 'Chrome',
    setSanitizedContent: jest.fn(),
    showBanner: jest.fn(),
}));

describe('Chrome clipboard writes', () => {
    afterEach(() => {
        delete navigator.clipboard;
    });

    test('writes without moving focus outside a dialog and waits before reporting success', async () => {
        let finish;
        const writeText = jest.fn(() => new Promise(resolve => { finish = resolve; }));
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
        const dialog = document.createElement('div');
        dialog.tabIndex = -1;
        document.body.appendChild(dialog);
        dialog.focus();

        const pending = createClipboard().write('http://localhost:7319/images');
        expect(document.activeElement).toBe(dialog);
        expect(document.getElementById('sk_clipboard')).toBeNull();
        expect(showBanner).not.toHaveBeenCalled();
        expect(writeText).toHaveBeenCalledWith('http://localhost:7319/images');
        finish();
        await pending;
        expect(showBanner).toHaveBeenCalledWith('Copied: http://localhost:7319/images');
        dialog.remove();
    });

    test('reports a rejected write without claiming success', async () => {
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: { writeText: jest.fn().mockRejectedValue(new Error('NotAllowedError')) },
        });
        await createClipboard().write('url');
        expect(showBanner).toHaveBeenCalledTimes(1);
        expect(showBanner).toHaveBeenCalledWith('Copy failed: unable to write to clipboard');
    });
});
