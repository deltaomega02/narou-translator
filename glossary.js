// glossary.js - 용어집 유틸리티 (content script에서 사용)

const Glossary = {
  async get(novelCode) {
    const result = await chrome.storage.local.get({ glossaries: {} });
    return result.glossaries[novelCode] || {};
  },

  async set(novelCode, glossary) {
    const result = await chrome.storage.local.get({ glossaries: {} });
    result.glossaries[novelCode] = glossary;
    await chrome.storage.local.set({ glossaries: result.glossaries });
  },

  async addEntry(novelCode, jp, kr) {
    const glossary = await this.get(novelCode);
    glossary[jp] = kr;
    await this.set(novelCode, glossary);
  },

  async removeEntry(novelCode, jp) {
    const glossary = await this.get(novelCode);
    delete glossary[jp];
    await this.set(novelCode, glossary);
  },

  async getAllNovelCodes() {
    const result = await chrome.storage.local.get({ glossaries: {} });
    return Object.keys(result.glossaries);
  },
};
