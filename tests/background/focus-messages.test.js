import policy from '../../src/common/focus-policy.json';
import {getSiteContext, messageGroups, pickMessageIndex} from '../../src/pages/focus-messages.js';

test('所有屏蔽网站都有完整文案，未知参数安全回退', () => {
    for (const site of policy.blockedDomains) {
        const context = getSiteContext(site);
        expect(context.site).toBe(site);
        const messages = messageGroups[context.group];
        expect(messages.length).toBeGreaterThanOrEqual(3);
        expect(messages.every(message => message.length === 3 && message.every(text => typeof text === 'string' && text.length > 0))).toBe(true);
    }
    for (const site of [null, 'unknown', '__proto__', 'constructor']) {
        expect(getSiteContext(site).group).toBe('general');
    }
});

test('随机覆盖所有其他文案，不连续重复', () => {
    for (const count of [3, 5, 6]) {
        for (let previous = 0; previous < count; previous++) {
            const indices = Array.from({length: count - 1}, (_, i) => pickMessageIndex(count, previous, (i + 0.5) / (count - 1)));
            expect(new Set(indices).size).toBe(count - 1);
            expect(indices).not.toContain(previous);
            expect(indices.every(index => index >= 0 && index < count)).toBe(true);
        }
    }
    expect(pickMessageIndex(3, null, 0)).toBe(0);
    expect(pickMessageIndex(3, null, 0.999)).toBe(2);
});
