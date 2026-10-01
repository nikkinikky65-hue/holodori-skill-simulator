// Catalog data and parameter interpretation remain shared and immutable.
// Only independent user card settings are persisted by this page.
async function renderCardCatalog(){
  const status = document.querySelector('#catalogStatus');
  if(!status) throw new Error('カードライブラリUIの必須要素がありません：#catalogStatus');
  let catalog;
  try{
    catalog = await loadRuntimeCardCatalog();
  }catch(error){
    status.dataset.errorKind = 'data';
    status.textContent = `カードデータを読み込めませんでした：${error.message}`;
    return;
  }
  try{
    const container = document.querySelector('#catalogCards');
    const search = document.querySelector('#catalogSearch');
    const rarityButtons = [...document.querySelectorAll('[data-catalog-rarity]')];
    let rarity = '5';
    const type = document.querySelector('#catalogType');
    readUserCardStates(); // Validate existing settings before presenting editable controls.
    // Same source order as library.js renderTalentSelect(); no separate roster.
    const memberOrder = new Map(HOLO_MEMBERS.map((member, index) => [member.id, index]));
    for(const [selector, element] of [['#catalogCards',container], ['#catalogSearch',search], ['#catalogType',type]]){
      if(!element) throw new Error(`必須要素がありません：${selector}`);
    }
    if(rarityButtons.map(button => button.dataset.catalogRarity).join(',') !== '5,4,3') throw new Error('レア度ボタン（★5・★4・★3）が不足、または順序が不正です。');
    delete status.dataset.errorKind;
    const render = () => {
      const query = search.value.trim().toLocaleLowerCase();
      const cards = catalog.cards.filter(card =>
        `${card.name} ${canonicalMemberName(card)}`.toLocaleLowerCase().includes(query) &&
        String(card.classification.rarity.mapping.value) === rarity &&
        (!type.value || card.classification.attributeType.mapping.value === type.value))
        .sort((a, b) =>
          (memberOrder.get(canonicalMemberId(a)) ?? Number.MAX_SAFE_INTEGER) -
          (memberOrder.get(canonicalMemberId(b)) ?? Number.MAX_SAFE_INTEGER) ||
          b.classification.rarity.mapping.value - a.classification.rarity.mapping.value);
      const userStates = readUserCardStates();
      container.replaceChildren();
      for(const card of cards){
        const panel = document.createElement('article');
        panel.className = 'panel catalogCard';
        panel.dataset.cardId = card.id;
        let userState = getUserCardState(card.id, userStates);
        const ownedLabel = document.createElement('label'); ownedLabel.className = 'catalogOwned';
        const owned = document.createElement('input'); owned.type = 'checkbox'; owned.dataset.catalogOwned = '';
        owned.setAttribute('aria-label', `${card.name}を所持`);
        ownedLabel.append(owned, document.createTextNode('所持'));
        const saveStatus = document.createElement('p'); saveStatus.className = 'sub catalogSaveStatus';
        saveStatus.setAttribute('role', 'status');
        const change = patch => {
          try{ userState = updateUserCardState(card.id, patch); saveStatus.textContent = ''; }
          catch(error){ saveStatus.textContent = `保存できませんでした：${error.message}`; }
          refresh();
        };
        const makeStepper = (field, title, max, dataKey) => {
          const group = document.createElement('div'); group.className = 'catalogStepper';
          group.setAttribute('role', 'group'); group.setAttribute('aria-label', `${card.name}の${title}`);
          const caption = document.createElement('span'); caption.textContent = title;
          const minus = document.createElement('button'); minus.type = 'button'; minus.textContent = '−';
          minus.dataset.step = '-1'; minus.setAttribute('aria-label', `${card.name}の${title}を減らす`);
          const value = document.createElement('output'); value.dataset[dataKey] = '';
          value.setAttribute('aria-label', `${title}段階`); value.setAttribute('aria-live', 'polite');
          const plus = document.createElement('button'); plus.type = 'button'; plus.textContent = '＋';
          plus.dataset.step = '1'; plus.setAttribute('aria-label', `${card.name}の${title}を増やす`);
          for(const [button, delta] of [[minus,-1],[plus,1]]) button.addEventListener('click', () => {
            const next = userState[field] + delta;
            if(next >= 0 && next <= max) change({[field]: next});
          });
          group.append(caption, minus, value, plus);
          return {group, sync: () => {
            value.value = String(userState[field]);
            minus.disabled = userState[field] === 0; plus.disabled = userState[field] === max;
          }};
        };
        const training = makeStepper('training', '特訓', 4, 'catalogTraining');
        const opening = makeStepper('opening', '開花', 5, 'catalogBloom');
        const basic = document.createElement('p'); basic.className = 'canonicalSlotStatus';
        const growth = document.createElement('div'); growth.className = 'canonicalGrowth';
        const preview = document.createElement('p');
        preview.className = 'canonicalSlotStatus';
        const refresh = () => {
          owned.checked = userState.owned; training.sync(); opening.sync();
          try{
            const expansion = expandCanonicalBloom(card, userState.opening, catalog.dataset, userState.training);
            basic.textContent = canonicalBasicText(expansion);
            // Layout only: retain the shared adapter's computed values and skills.
            const [parameters, ...skills] = canonicalEffectsText(expansion)
              .replace(/\n(SP：[\s\S]*?)\n(P：[\s\S]*?)\n(A：[\s\S]*)$/, '\n$1\n$3\n$2')
              .replace(/^(SP|A|P)：/gm, (_, label) => `${label} Lv.${expansion.levels[{SP:'special',A:'active',P:'passive'}[label]]}：`)
              .split('\n');
            const [pts, total] = parameters.split(' / TOTAL ');
            const ptsLine = document.createElement('span');
            ptsLine.className = 'catalogParameters';
            ptsLine.textContent = pts;
            const totalLine = document.createElement('span');
            totalLine.className = 'catalogTotal';
            totalLine.textContent = `TOTAL ${total}`;
            preview.replaceChildren(ptsLine, document.createTextNode('\n'), totalLine,
              document.createTextNode('\n' + skills.join('\n')));
          }
          catch(error){ preview.textContent = `表示できません：${error.message}`; }
        };
        owned.addEventListener('change', () => change({owned: owned.checked}));
        growth.append(training.group, opening.group);
        panel.append(basic, ownedLabel, growth, saveStatus, preview); container.append(panel);
        refresh();
      }
      status.textContent = `${cards.length} / ${catalog.cards.length}枚`;
    };
    search.addEventListener('input', render);
    for(const button of rarityButtons) button.addEventListener('click', () => {
      rarity = button.dataset.catalogRarity;
      for(const item of rarityButtons) item.setAttribute('aria-pressed', String(item === button));
      render();
    });
    type.addEventListener('change', render);
    render();
  }catch(error){
    status.dataset.errorKind = 'ui';
    status.textContent = `カードライブラリのUIを初期化できませんでした：${error.message}`;
  }
}
const cardCatalogReady = renderCardCatalog();
