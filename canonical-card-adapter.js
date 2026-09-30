// Browser code reads only the derived Runtime Catalog, never complete Canonical.
const RUNTIME_CATALOG_URL = new URL('data/runtime-cards.json', document.baseURI);
let runtimeCatalogPromise = null;

function loadRuntimeCardCatalog(){
  if(!runtimeCatalogPromise){
    runtimeCatalogPromise = fetch(RUNTIME_CATALOG_URL)
      .then(response => {
        if(!response.ok) throw new Error(`catalog load failed: ${response.status}`);
        return response.json();
      })
      .then(catalog => {
        if(catalog.format !== 'holodori-runtime-catalog-v1' || !catalog.dataset?.version ||
           !Array.isArray(catalog.cards) || catalog.cards.length !== 185 ||
           new Set(catalog.cards.map(card => card.id)).size !== 185){
          throw new Error('Runtime Catalog shape is unexpected.');
        }
        return catalog;
      }).catch(error => { runtimeCatalogPromise = null; throw error; });
  }
  return runtimeCatalogPromise;
}

function canonicalNumber(value){
  if(value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
function canonicalMemberName(card){ return card.member.name; }
function canonicalMemberId(card){
  const mapping = card.member.mapping;
  if(mapping.status !== 'candidate' || !mapping.id) return null;
  if(typeof HOLO_MEMBERS !== 'undefined' && !HOLO_MEMBERS.some(member => member.id === mapping.id && member.name === card.member.name)) return null;
  return mapping.id;
}
function canonicalSkillText(level){ return level.description || ''; }

function adaptCanonicalCardToActiveInput(card, levelNumber){
  const level = card.skills.active.levels.find(item => item.level === Number(levelNumber));
  if(!level) throw new Error('Selected Active level was not found.');
  const talentId = canonicalMemberId(card);
  const cycleMs = canonicalNumber(level.raw.coolTimeMillisecond);
  const durationMs = canonicalNumber(level.raw.effectDurationMillisecond);
  const probability = level.qualitativeProbability.value;
  const effect = level.baseEffect.raw;
  const value = canonicalNumber(effect.value);
  const boost = effect.type === 'LiveActiveSkillEffectType_LIVE_ACTIVE_SKILL_EFFECT_TYPE_SCORE_UP_PERMIL_UP' && value !== null ? value / 10 : null;
  if(!card.name || !talentId || cycleMs === null || durationMs === null || !['low','mid','high'].includes(probability) || boost === null){
    throw new Error('現在のActive入力へ対応できない情報があります。');
  }
  return {
    canonicalCardId: card.id, level: level.level, memberId: talentId, costume: card.name,
    interval: cycleMs / 1000, probability, duration: durationMs / 1000, boost,
    conditionalOverrideCount: level.conditionalOverrides.length,
    warnings: [
      '効果値は原文と照合した候補対応です。raw値や確率係数をゲーム内計算規則として確定していません。',
      ...(level.conditionalOverrides.length ? ['条件付き上位効果は計算せず、base effectのみを入力しました。条件成立時は置換であり、加算ではありません。'] : []),
      'Libraryへの自動登録は行っていません。'
    ]
  };
}

// P/SP and replacements remain structured data, separate from executable A base.
function expandCanonicalCard(card, levels, dataset){
  const selected = {};
  for(const kind of ['passive', 'active', 'special']){
    const level = card.skills[kind].levels.find(item => item.level === Number(levels[kind]));
    if(!level) throw new Error(`${kind}のレベルを選択してください。`);
    selected[kind] = JSON.parse(JSON.stringify(level));
  }
  const observed = selected.passive.condition.state === 'observed';
  return {
    source: {cardId: card.id, pointer: card.source, dataset: JSON.parse(JSON.stringify(dataset))},
    basic: {name: card.name, member: JSON.parse(JSON.stringify(card.member)), classification: JSON.parse(JSON.stringify(card.classification))},
    levels: Object.fromEntries(Object.entries(selected).map(([kind, level]) => [kind, level.level])),
    passive: {data: selected.passive, conditionStatus: observed ? 'observed-not-evaluated' : 'unresolved', calculationStatus: 'deferred'},
    active: {data: selected.active, calculationStatus: 'base-only'},
    special: {data: selected.special, durationMilliseconds: selected.special.raw.effectDurationMillisecond, durationScope: 'unresolved-per-effect', calculationStatus: 'display-only'},
    activeInput: adaptCanonicalCardToActiveInput(card, levels.active),
    unresolved: [
      observed ? 'Passive：出典の条件を保持し、計算適用を保留します。' : 'Passive：条件未確認。条件なしとは扱わず、計算適用を保留します。',
      'Special：独立した複数効果とレベル行の時間を保持。個別効果への時間適用は未確認で、発動頻度UP・常時Score Supportには適用しません。',
      'メンバー・属性・レア度は候補対応です。育成状態や最終ステータスは推定しません。'
    ]
  };
}

function canonicalExpansionText(expansion){
  const text = level => (level.description || '').replace(/\[[^\]]+\]/g, '');
  const duration = canonicalNumber(expansion.special.durationMilliseconds);
  return [
    `${expansion.basic.name} / P Lv.${expansion.levels.passive}・A Lv.${expansion.levels.active}・SP Lv.${expansion.levels.special}`,
    `メンバー候補：${expansion.basic.member.name}`,
    `Passive：${text(expansion.passive.data)}`, `Active：${text(expansion.active.data)}`, `Special：${text(expansion.special.data)}`,
    `Special持続時間（レベル行）：${duration === null ? '未確認' : duration / 1000 + '秒'}。個別効果への割当は未確認。`,
    ...expansion.activeInput.warnings, ...expansion.unresolved,
    '呼出元の情報です。Active手入力の変更はこの表示に反映しません。',
    `出典：${expansion.source.cardId} / ${expansion.source.dataset.sourceDataset.repository} / ${expansion.source.dataset.sourceDataset.commitSha}`
  ].join('\n');
}
function showCanonicalExpansion(target, expansion){
  if(target) target.textContent = expansion ? canonicalExpansionText(expansion) : '';
}

function adaptCanonicalCardToEventCard(card, levelNumber, expansion = null){
  const active = adaptCanonicalCardToActiveInput(card, levelNumber);
  return {
    id: `canonical:${active.canonicalCardId}:lv${active.level}` + (expansion ? `:p${expansion.levels.passive}:s${expansion.levels.special}` : ''),
    canonicalExpansion: expansion, sourceCardId: card.id, sourceKind: 'canonical',
    talentId: active.memberId, cardName: active.costume,
    type: card.classification.attributeType?.mapping?.value || '',
    rarity: card.classification.rarity?.mapping?.value ?? null,
    skills: {active: {interval: active.interval, probability: active.probability, duration: active.duration, boost: active.boost}},
    canonicalWarnings: active.warnings
  };
}

// Persist identifiers and independent levels only. Never serialize an expansion.
function canonicalSelection(expansion){
  return {version: 1, cardId: expansion.source.cardId, levels: {...expansion.levels}, datasetVersion: expansion.source.dataset.version};
}
function readCanonicalSelection(cardId, selection, legacyExpansion){
  const match = /^(.+):lv(\d+)$/.exec(cardId || '');
  if(!match) return null;
  const levels = selection?.levels || legacyExpansion?.levels || {active: Number(match[2])};
  const result = {version: 1, cardId: match[1], levels: {}};
  for(const kind of ['passive','active','special']){
    if(Number.isInteger(levels[kind]) && levels[kind] > 0) result.levels[kind] = levels[kind];
  }
  if(selection?.datasetVersion) result.datasetVersion = selection.datasetVersion;
  else if(selection?.legacySourceCommit) result.legacySourceCommit = selection.legacySourceCommit;
  else if(legacyExpansion?.source?.dataset?.commitSha) result.legacySourceCommit = legacyExpansion.source.dataset.commitSha;
  return result;
}

// Render one selected card, rather than 185 expanded panels. Independent skill
// selections are reset on card change and never inferred from progression.
let canonicalPickerRequest = 0;
async function openCanonicalCardPicker({targetText, apply}){
  const request = ++canonicalPickerRequest;
  const modal = document.querySelector('#canonicalCardModal');
  const status = document.querySelector('#canonicalCardStatus');
  const cardList = document.querySelector('#canonicalCardList');
  const target = document.querySelector('#canonicalCardTarget');
  if(!modal || !status || !cardList || !target) return;
  target.textContent = targetText || '';
  status.textContent = 'カードデータを読み込み中…';
  cardList.replaceChildren();
  modal.hidden = false;
  try{
    const dataset = await loadRuntimeCardCatalog();
    if(request !== canonicalPickerRequest || modal.hidden) return;
    const searchLabel = document.createElement('label');
    searchLabel.textContent = 'カード名・メンバー名で検索';
    const search = document.createElement('input');
    search.type = 'search';
    search.dataset.canonicalSearch = '';
    searchLabel.append(search);
    const choiceLabel = document.createElement('label');
    choiceLabel.textContent = 'カード';
    const choice = document.createElement('select');
    choice.dataset.canonicalCard = '';
    choice.size = 7;
    choiceLabel.append(choice);
    const selectedPanel = document.createElement('div');
    selectedPanel.className = 'canonicalCardChoice';
    cardList.append(searchLabel, choiceLabel, selectedPanel);
    const rows = dataset.cards.map(card => ({card, name: card.name, member: canonicalMemberName(card)}));
    let displayedCardId = null;
    const renderSelected = () => {
      if(displayedCardId === choice.value) return;
      displayedCardId = choice.value;
      selectedPanel.replaceChildren();
      const card = rows.find(row => row.card.id === choice.value)?.card;
      if(!card) return;
      const controls = document.createElement('div');
      controls.className = 'canonicalCardChoiceControls';
      const selectors = {};
      const details = document.createElement('details');
      const summary = document.createElement('summary');
      summary.textContent = 'スキル・出典の詳細';
      const preview = document.createElement('p');
      preview.className = 'canonicalSlotStatus';
      details.append(summary, preview);
      const applyButton = document.createElement('button');
      applyButton.type = 'button';
      applyButton.textContent = 'このカードを呼び出す';
      const expand = () => expandCanonicalCard(card, Object.fromEntries(Object.entries(selectors).map(([kind, select]) => [kind, Number(select.value)])), dataset.dataset);
      const refresh = () => {
        try{
          showCanonicalExpansion(preview, expand());
          applyButton.disabled = false;
        }catch(error){
          preview.textContent = `現在の入力欄へ展開できません：${error.message}`;
          details.open = true;
          applyButton.disabled = true;
        }
      };
      for(const [kind, label] of [['passive', 'Passive'], ['active', 'Active'], ['special', 'Special']]){
        const levelLabel = document.createElement('label');
        levelLabel.textContent = `${label}レベル`;
        const select = document.createElement('select');
        select.dataset.canonicalSkill = kind;
        if(kind === 'active') select.dataset.canonicalLevel = '';
        for(const level of card.skills[kind].levels){
          const option = document.createElement('option');
          option.value = String(level.level);
          option.textContent = `Lv.${level.level}`;
          select.append(option);
        }
        selectors[kind] = select;
        select.addEventListener('change', refresh);
        levelLabel.append(select);
        controls.append(levelLabel);
      }
      applyButton.addEventListener('click', () => {
        try{
          const expansion = expand();
          apply(card, expansion.levels.active, expansion);
          closeCanonicalCardPicker();
        }catch(error){ status.textContent = `呼び出せませんでした：${error.message}`; }
      });
      controls.append(applyButton);
      const notice = document.createElement('p');
      notice.className = 'sub';
      notice.textContent = 'Activeの基本効果だけを計算に使用します。条件付き上位効果・Passive・Specialは計算に適用しません。';
      selectedPanel.append(controls, notice, details);
      refresh();
    };
    const filter = () => {
      const previous = choice.value;
      const query = search.value.trim().toLocaleLowerCase();
      const matches = rows.filter(row => `${row.name} ${row.member} ${row.card.id}`.toLocaleLowerCase().includes(query));
      choice.replaceChildren();
      for(const row of matches){
        const option = document.createElement('option');
        option.value = row.card.id;
        const rarity = row.card.classification.rarity?.mapping?.value;
        option.textContent = `${row.member} / ${row.name}${rarity ? ` / ★${rarity}` : ''}`;
        choice.append(option);
      }
      choice.value = matches.some(row => row.card.id === previous) ? previous : matches[0]?.card.id || '';
      status.textContent = `${matches.length} / ${rows.length}枚`;
      renderSelected();
    };
    search.addEventListener('input', filter);
    choice.addEventListener('change', renderSelected);
    filter();
    search.focus();
  }catch(error){
    if(request === canonicalPickerRequest) status.textContent = `カードデータを読めませんでした。HTTPでページを開いてください。${error.message}`;
  }
}

function closeCanonicalCardPicker(){
  canonicalPickerRequest++;
  const modal = document.querySelector('#canonicalCardModal');
  if(modal) modal.hidden = true;
  document.querySelector('#canonicalCardList')?.replaceChildren();
}

document.addEventListener('click', event => {
  if(event.target.closest('[data-close-canonical-card-modal]')) closeCanonicalCardPicker();
});
