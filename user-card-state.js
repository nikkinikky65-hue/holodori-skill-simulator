// User-owned card settings keyed by external Canonical card ID. No catalog data
// or simulator/Library state is copied into this independent versioned store.
const USER_CARD_STATE_STORAGE_KEY = 'holodori-user-card-state-v1';
function validateUserCardState(state){
  if(!state || typeof state !== 'object' || Array.isArray(state) ||
     typeof state.owned !== 'boolean' || !Number.isInteger(state.training) ||
     state.training < 0 || state.training > 4 || !Number.isInteger(state.opening) ||
     state.opening < 0 || state.opening > 5){
    throw new Error('カードの所持・育成データが不正です。元の保存データは保持しています。');
  }
  return state;
}
function readUserCardStates(){
  const saved = localStorage.getItem(USER_CARD_STATE_STORAGE_KEY);
  if(saved === null) return {version: 1, cards: {}};
  const store = JSON.parse(saved);
  if(!store || store.version !== 1 || !store.cards || typeof store.cards !== 'object' || Array.isArray(store.cards)){
    throw new Error('所持カード保存形式に対応していません。元の保存データは保持しています。');
  }
  for(const state of Object.values(store.cards)) validateUserCardState(state);
  return store;
}
function getUserCardState(cardId, store = readUserCardStates()){
  return Object.prototype.hasOwnProperty.call(store.cards, cardId)
    ? {...store.cards[cardId]} : {owned: false, training: 0, opening: 0};
}
function updateUserCardState(cardId, patch){
  if(typeof cardId !== 'string' || !cardId || Object.keys(patch).some(key => !['owned','training','opening'].includes(key))){
    throw new Error('カード設定の更新内容が不正です。');
  }
  // Read latest storage before merging so other cards and future fields survive.
  const store = readUserCardStates();
  const state = validateUserCardState({...getUserCardState(cardId, store), ...patch});
  localStorage.setItem(USER_CARD_STATE_STORAGE_KEY, JSON.stringify({...store, cards: {...store.cards, [cardId]: state}}));
  return state;
}

// Read-only snapshot: saved:false is distinct from an explicitly unowned card.
function exportUserCardStates(catalog, exportedAt = new Date().toISOString()){
  const raw = localStorage.getItem(USER_CARD_STATE_STORAGE_KEY);
  const savedData = raw === null ? null : JSON.parse(raw);
  if(raw !== null){
    if(!savedData || savedData.version !== 1 || !savedData.cards || typeof savedData.cards !== 'object' || Array.isArray(savedData.cards)) throw new Error('未対応の所持カード保存形式です。');
    Object.values(savedData.cards).forEach(validateUserCardState);
  }
  const cards = savedData?.cards ?? {};
  const knownIds = new Set(catalog.cards.map(card => card.id));
  const ids = [...new Set([...knownIds, ...Object.keys(cards)])];
  return {
    format: 'holodori-user-card-state-export', version: 1, exportedAt,
    source: {page: 'card-catalog.html', storageKey: USER_CARD_STATE_STORAGE_KEY,
      storagePresent: raw !== null, dataset: catalog.dataset},
    cards: ids.map(cardId => {
      const saved = Object.prototype.hasOwnProperty.call(cards, cardId);
      return {cardId, inCatalog: knownIds.has(cardId), saved,
        state: saved ? {...cards[cardId]} : null};
    }),
    // Retain extension fields and distinguish no store from an empty saved store.
    savedData
  };
}
