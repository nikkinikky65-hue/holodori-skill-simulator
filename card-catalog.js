// Read-only view of the same generated catalog and common skill/Bloom adapter.
// Bloom choices are view state only; member Library and saved formations are untouched.
async function renderCardCatalog(){
  const status = document.querySelector('#catalogStatus');
  const container = document.querySelector('#catalogCards');
  const search = document.querySelector('#catalogSearch');
  const rarity = document.querySelector('#catalogRarity');
  const type = document.querySelector('#catalogType');
  const blooms = new Map();
  const trainings = new Map();
  try{
    const catalog = await loadRuntimeCardCatalog();
    const render = () => {
      const query = search.value.trim().toLocaleLowerCase();
      const cards = catalog.cards.filter(card =>
        `${card.name} ${canonicalMemberName(card)}`.toLocaleLowerCase().includes(query) &&
        (!rarity.value || String(card.classification.rarity.mapping.value) === rarity.value) &&
        (!type.value || card.classification.attributeType.mapping.value === type.value));
      container.replaceChildren();
      for(const card of cards){
        const panel = document.createElement('article');
        panel.className = 'panel catalogCard';
        panel.dataset.cardId = card.id;
        const label = document.createElement('label');
        label.textContent = 'Bloom段階';
        const select = document.createElement('select');
        select.dataset.catalogBloom = '';
        select.setAttribute('aria-label', `${card.name}のBloom段階`);
        for(let bloom = 0; bloom <= 5; bloom++){
          const option = document.createElement('option');
          option.value = String(bloom); option.textContent = `Bloom ${bloom}`;
          select.append(option);
        }
        select.value = String(blooms.get(card.id) ?? 0);
        const trainingLabel = document.createElement('label');
        trainingLabel.textContent = '特訓（限界突破）';
        const training = document.createElement('select');
        training.dataset.catalogTraining = '';
        training.setAttribute('aria-label', `${card.name}の特訓段階`);
        for(const row of card.progression.trainingStages){
          const option = document.createElement('option');
          option.value = String(row.stage); option.textContent = `特訓 ${row.stage} / Lv${row.levelCap}`;
          training.append(option);
        }
        training.value = String(trainings.get(card.id) ?? 0);
        trainingLabel.append(training);
        const preview = document.createElement('p');
        preview.className = 'canonicalSlotStatus';
        const refresh = () => {
          const bloom = Number(select.value);
          blooms.set(card.id, bloom);
          trainings.set(card.id, Number(training.value));
          try{ showCanonicalExpansion(preview, expandCanonicalBloom(card, bloom, catalog.dataset, Number(training.value))); }
          catch(error){ preview.textContent = `表示できません：${error.message}`; }
        };
        select.addEventListener('change', refresh);
        training.addEventListener('change', refresh);
        label.append(select); panel.append(label, trainingLabel, preview); container.append(panel);
        refresh();
      }
      status.textContent = `${cards.length} / ${catalog.cards.length}枚`;
    };
    search.addEventListener('input', render);
    rarity.addEventListener('change', render);
    type.addEventListener('change', render);
    render();
  }catch(error){ status.textContent = `カードデータを読み込めませんでした：${error.message}`; }
}
const cardCatalogReady = renderCardCatalog();
