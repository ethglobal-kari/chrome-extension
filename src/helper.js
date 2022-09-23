const Storage = {
  get: async (name) => {
    return (await chrome.storage.sync.get([name]))[name];
  },
  set: (name, value) => {
    chrome.storage.sync.set({
      [name]: value,
    });
  },
};

const StorageType = {
  history: 'history',
  current: 'current',
  latest: 'latest',
};

export { Storage, StorageType };
