import {getSiteContext, messageGroups, pickMessageIndex} from './focus-messages.js';

const context = getSiteContext(new URLSearchParams(location.search).get('site'));
const messages = messageGroups[context.group];
const readIndex = (storage, key) => {
    try {
        const value = storage.getItem(key);
        return value === null ? null : JSON.parse(value);
    } catch { return null; }
};
const saveIndex = (storage, key, value) => {
    try { storage.setItem(key, JSON.stringify(value)); } catch { /* 存储不可用时仍显示提醒。 */ }
};
const key = `focus-message:${context.site}`;
const navigationType = performance.getEntriesByType('navigation')[0]?.type;
const saved = readIndex(sessionStorage, key);
const reuse = ['reload', 'back_forward'].includes(navigationType) && Number.isInteger(saved) && saved >= 0 && saved < messages.length;
const index = reuse ? saved : pickMessageIndex(messages.length, readIndex(localStorage, key), Math.random());
saveIndex(sessionStorage, key, index);
saveIndex(localStorage, key, index);
const [title, body, nextStep] = messages[index];
document.querySelector('.eyebrow').textContent = context.name ? `${context.name} · 给此刻的自己` : '给此刻的自己';
document.querySelector('h1').textContent = title;
document.getElementById('focus-body').textContent = body;
document.getElementById('focus-next').textContent = nextStep;

document.getElementById('close-tab').addEventListener('click', async () => {
    const tab = await chrome.tabs.getCurrent();
    if (tab?.id !== undefined) await chrome.tabs.remove(tab.id);
});
