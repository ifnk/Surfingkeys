import { getCyclicResultPage } from 'src/content_scripts/ui/omnibarPagination.js';

describe('Omnibar result pagination', () => {
    test('moves forward and wraps to the first page', () => {
        expect(getCyclicResultPage(1, 25, 10, 1)).toBe(2);
        expect(getCyclicResultPage(3, 25, 10, 1)).toBe(1);
    });

    test('moves backward and wraps to the last page', () => {
        expect(getCyclicResultPage(3, 25, 10, -1)).toBe(2);
        expect(getCyclicResultPage(1, 25, 10, -1)).toBe(3);
    });

    test('keeps an empty result set on page one', () => {
        expect(getCyclicResultPage(1, 0, 10, 1)).toBe(1);
        expect(getCyclicResultPage(1, 0, 10, -1)).toBe(1);
    });
});
