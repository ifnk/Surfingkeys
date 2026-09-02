import { addLineBoundaryMappings } from 'src/content_scripts/ui/vim.js';

describe('Ace Vim line-boundary mappings', () => {
    test('maps gh and gl in normal, visual and operator-pending modes', () => {
        const vim = {map: jest.fn()};

        addLineBoundaryMappings(vim);

        expect(vim.map.mock.calls).toEqual([
            ['gh', '^', 'normal'],
            ['gl', '$', 'normal'],
            ['gh', '^', 'visual'],
            ['gl', '$', 'visual'],
            ['gh', '^', 'operatorPending'],
            ['gl', '$', 'operatorPending'],
        ]);
    });
});
