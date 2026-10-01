// Read-only view of the same generated catalog and common skill/Bloom adapter.
// Bloom choices are view state only; member Library and saved formations are untouched.
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
    const blooms = new Map();
    const trainings = new Map();
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
        (!type.value || card.classification.attributeType.mapping.value === type.value));
      container.replaceChildren();
      for(const card of cards){
        const panel = document.createElement('article');
        panel.className = 'panel catalogCard';
        panel.dataset.cardId = card.id;
        const trainingLabel = document.createElement('label');
        trainingLabel.textContent = '特訓';
        const training = document.createElement('select');
        training.dataset.catalogTraining = '';
        training.setAttribute('aria-label', `${card.name}の特訓段階`);
        for(const row of card.progression.trainingStages){
          const option = document.createElement('option');
          option.value = String(row.stage); option.textContent = String(row.stage);
          training.append(option);
        }
        training.value = String(trainings.get(card.id) ?? 0);
        trainingLabel.append(training);
        const label = document.createElement('label');
        label.textContent = '開花';
        const select = document.createElement('select');
        select.dataset.catalogBloom = '';
        select.setAttribute('aria-label', `${card.name}の開花段階`);
        for(let bloom = 0; bloom <= 5; bloom++){
          const option = document.createElement('option');
          option.value = String(bloom); option.textContent = String(bloom);
          select.append(option);
        }
        select.value = String(blooms.get(card.id) ?? 0);
        const basic = document.createElement('p'); basic.className = 'canonicalSlotStatus';
        const growth = document.createElement('div'); growth.className = 'canonicalGrowth';
        const preview = document.createElement('p');
        preview.className = 'canonicalSlotStatus';
        const refresh = () => {
          const bloom = Number(select.value);
          blooms.set(card.id, bloom);
          trainings.set(card.id, Number(training.value));
          try{
            const expansion = expandCanonicalBloom(card, bloom, catalog.dataset, Number(training.value));
            basic.textContent = canonicalBasicText(expansion);
            // Layout only: retain the shared adapter's computed values and skills.
            const [parameters, ...skills] = canonicalEffectsText(expansion).split('\n');
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
        select.addEventListener('change', refresh);
        training.addEventListener('change', refresh);
        label.append(select); growth.append(trainingLabel, label); panel.append(basic, growth, preview); container.append(panel);
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
