import policy from '../common/focus-policy.json';

export const shouldBlockUrl = (value) => {
    try {
        const url = new URL(value);
        if (!['http:', 'https:'].includes(url.protocol)) return false;
        const matches = (domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`);
        return !policy.allowedDomains.some(matches) && policy.blockedDomains.some(matches);
    } catch {
        return false;
    }
};

export const getBlockedDomain = (value) => {
    if (!shouldBlockUrl(value)) return null;
    const hostname = new URL(value).hostname;
    return policy.blockedDomains.find(domain => hostname === domain || hostname.endsWith(`.${domain}`));
};

// 请求规则负责首次导航；标签页监听补充已打开页面与站内地址变化。
export const startFocusBlocking = () => {
    const redirectTab = (tab) => {
        const domain = getBlockedDomain(tab.pendingUrl || tab.url);
        if (tab.id >= 0 && domain) {
            chrome.tabs.update(tab.id, {url: chrome.runtime.getURL(`pages/focus.html?site=${encodeURIComponent(domain)}`)});
        }
    };
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (changeInfo.url || changeInfo.status === 'loading') redirectTab(tab);
    });
    chrome.tabs.query({}, (tabs) => tabs.forEach(redirectTab));
};
