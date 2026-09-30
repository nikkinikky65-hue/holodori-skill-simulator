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

// Baseline and target-level semantics are the confirmed game rule. Stage positions
// and target values come from source Bloom rows, never rarity or a second table.
function canonicalBloomLevels(card, bloom){
  if(!Number.isInteger(bloom) || bloom < 0 || bloom > 5) throw new Error('開花は0〜5で指定してください。');
  const levels = {passive: 1, active: 1, special: 1};
  const prefix = 'CardPotentialEffectType_CARD_POTENTIAL_EFFECT_TYPE_';
  const kinds = {[prefix + 'ACTIVE_SKILL_LEVEL_UP']: 'active', [prefix + 'SPECIAL_SKILL_LEVEL_UP']: 'special', [prefix + 'PASSIVE_SKILL_LEVEL_UP']: 'passive'};
  const steps = card.progression.bloomSteps;
  if(!Array.isArray(steps) || steps.length !== 5 || new Set(steps.map(row => row.step)).size !== 5 ||
     steps.some(row => !Number.isInteger(row.step) || row.step < 1 || row.step > 5)) throw new Error('開花情報が未確認です。');
  for(const row of [...steps].sort((a,b) => a.step - b.step)){
    if(row.step > bloom) continue;
    const kind = kinds[row.effectType];
    if(kind){
      const level = canonicalNumber(row.value);
      if(!Number.isInteger(level) || !card.skills[kind].levels.some(item => item.level === level)) throw new Error('開花のスキル情報が未確認です。');
      levels[kind] = level;
    }else if(![prefix + 'ALL_PARAMETER_UP_PERMIL_UP', prefix + 'SKILL_TREE_CONNECT_EFFECT_LEVEL_UP'].includes(row.effectType)){
      throw new Error('未対応の開花効果です。');
    }
  }
  return levels;
}
// Select actual CardLevelLimit and level-row facts. No rarity table, growth
// interpolation, per-stat rounding, Bloom or board correction is involved.
function canonicalTrainingStats(card, training){
  if(!Number.isInteger(training)) throw new Error('特訓段階が未確認です。');
  const stages = card.progression.trainingStages.filter(row => row.stage === training);
  if(stages.length !== 1) throw new Error('特訓段階のLv上限が見つかりません。');
  const snapshots = card.progression.statSnapshots.filter(row => row.level === stages[0].levelCap);
  if(snapshots.length !== 1 || canonicalNumber(snapshots[0].raw.parameterBaseValue) === null) throw new Error('上限Lvの基礎値が見つかりません。');
  return {training, level: stages[0].levelCap, parameterBaseValue: snapshots[0].raw.parameterBaseValue,
    limitSource: stages[0].source, snapshot: JSON.parse(JSON.stringify(snapshots[0]))};
}
function canonicalTrainingText(stats){
  return `P — / T — / S — / TOTAL ${stats.parameterBaseValue}`;
}
function expandCanonicalBloom(card, bloom, dataset, training = 0){
  return {...expandCanonicalCard(card, canonicalBloomLevels(card, bloom), dataset), bloom,
    training, trainingStats: canonicalTrainingStats(card, training)};
}
function canonicalTypeName(type){ return {cute:'キュート', happy:'ハッピー', pure:'ピュア'}[type] || 'タイプ未確認'; }
function canonicalBasicText(expansion){
  return `${expansion.basic.name}\n${expansion.basic.member.name} / ★${expansion.basic.classification.rarity?.mapping?.value ?? '?'} / ${canonicalTypeName(expansion.basic.classification.attributeType?.mapping?.value)}`;
}
function canonicalEffectsText(expansion){
  const text = level => (level.description || '説明未確認').replace(/\[[^\]]+\]/g, '');
  return [
    expansion.trainingStats ? canonicalTrainingText(expansion.trainingStats) : 'P — / T — / S — / TOTAL —',
    '',
    ...[['special','SP'],['passive','P'],['active','A']].map(([kind,label]) => `${label}：${text(expansion[kind].data)}`)
  ].join('\n');
}
function canonicalExpansionText(expansion){
  return canonicalBasicText(expansion) + '\n' + canonicalEffectsText(expansion);
}
function showCanonicalExpansion(target, expansion){
  if(target) target.textContent = expansion ? canonicalExpansionText(expansion) : '';
}

function adaptCanonicalCardToEventCard(card, levelNumber, expansion = null){
  const active = adaptCanonicalCardToActiveInput(card, levelNumber);
  return {
    id: Number.isInteger(expansion?.bloom) ? `canonical:${card.id}:bloom${expansion.bloom}${expansion.training ? ':training' + expansion.training : ''}` : `canonical:${active.canonicalCardId}:lv${active.level}` + (expansion ? `:p${expansion.levels.passive}:s${expansion.levels.special}${expansion.training ? ':training' + expansion.training : ''}` : ''),
    canonicalExpansion: expansion, sourceCardId: card.id, sourceKind: 'canonical',
    talentId: active.memberId, cardName: active.costume,
    type: card.classification.attributeType?.mapping?.value || '',
    rarity: card.classification.rarity?.mapping?.value ?? null,
    skills: {active: {interval: active.interval, probability: active.probability, duration: active.duration, boost: active.boost}},
    canonicalWarnings: active.warnings
  };
}

// New saves use card + Bloom. Independent levels survive only for legacy saves.
// The released pre-Bloom catalog had this exact Canonical hash; allow that one
// metadata-only migration, not arbitrary dataset mismatches.
function canonicalDatasetMatches(selection, dataset){
  if(selection.canonicalSha256) return selection.canonicalSha256 === dataset.canonicalSha256;
  if(selection.legacySourceCommit) return selection.legacySourceCommit === dataset.sourceDataset.commitSha;
  return !selection.datasetVersion || selection.datasetVersion === dataset.version ||
    selection.datasetVersion === 'a762a8bf08ea38ff73aba1387e681b9fe0c0fc3f151f2e792fce2d7ed7f514d4' &&
    dataset.canonicalSha256 === '306a0d43a4785983ddb200e0ace01d0f9d84a887d3ee6cab5fa44935dd9f8ef1';
}
function canonicalSelection(expansion){
  if(Number.isInteger(expansion.bloom)) return {version: 2, cardId: expansion.source.cardId, bloom: expansion.bloom, training: expansion.training, canonicalSha256: expansion.source.dataset.canonicalSha256};
  return {version: 1, cardId: expansion.source.cardId, levels: {...expansion.levels}, ...(expansion.training !== undefined ? {training: expansion.training} : {}), datasetVersion: expansion.source.dataset.version, canonicalSha256: expansion.source.dataset.canonicalSha256};
}
function readCanonicalSelection(cardId, selection, legacyExpansion){
  const bloomMatch = /^(.+):bloom([0-5])$/.exec(cardId || '');
  if(bloomMatch){
    if(selection?.version !== 2 || selection.cardId !== bloomMatch[1] || selection.bloom !== Number(bloomMatch[2])) return null;
    return {version: 2, cardId: selection.cardId, bloom: selection.bloom, ...(selection.training !== undefined ? {training: selection.training} : {}), canonicalSha256: selection.canonicalSha256};
  }
  const match = /^(.+):lv(\d+)$/.exec(cardId || '');
  if(!match) return null;
  const levels = selection?.levels || legacyExpansion?.levels || {active: Number(match[2])};
  const result = {version: 1, cardId: match[1], levels: {}};
  for(const kind of ['passive','active','special']){
    if(Number.isInteger(levels[kind]) && levels[kind] > 0) result.levels[kind] = levels[kind];
  }
  if(selection?.training !== undefined) result.training = selection.training;
  if(selection?.canonicalSha256) result.canonicalSha256 = selection.canonicalSha256;
  if(selection?.datasetVersion) result.datasetVersion = selection.datasetVersion;
  else if(selection?.legacySourceCommit) result.legacySourceCommit = selection.legacySourceCommit;
  else if(legacyExpansion?.source?.dataset?.commitSha) result.legacySourceCommit = legacyExpansion.source.dataset.commitSha;
  return result;
}

// Render one selected card; Bloom controls the shared expansion.
let canonicalPickerRequest = 0;
async function openCanonicalCardPicker({targetText, apply, selection = null}){
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
      const bloomLabel = document.createElement('label');
      bloomLabel.textContent = '開花';
      const bloomSelect = document.createElement('select');
      bloomSelect.dataset.canonicalBloom = '';
      const legacy = selection?.cardId === card.id && selection.version === 1;
      if(legacy){
        const option = document.createElement('option'); option.value = ''; option.textContent = '未指定（旧保存を保持）'; bloomSelect.append(option);
      }
      for(let bloom = 0; bloom <= 5; bloom++){
        const option = document.createElement('option'); option.value = String(bloom); option.textContent = String(bloom); bloomSelect.append(option);
      }
      if(selection?.cardId === card.id && selection.version === 2) bloomSelect.value = String(selection.bloom);
      bloomLabel.append(bloomSelect);

      const trainingLabel = document.createElement('label');
      trainingLabel.textContent = '特訓';
      const trainingSelect = document.createElement('select');
      trainingSelect.dataset.canonicalTraining = '';
      for(const row of card.progression.trainingStages){
        const option = document.createElement('option');
        option.value = String(row.stage); option.textContent = String(row.stage);
        trainingSelect.append(option);
      }
      if(selection?.cardId === card.id && selection.training !== undefined) trainingSelect.value = String(selection.training);
      trainingLabel.append(trainingSelect);
      const growth = document.createElement('div'); growth.className = 'canonicalGrowth';
      growth.append(trainingLabel, bloomLabel); controls.append(growth);
      const basic = document.createElement('p'); basic.className = 'canonicalSlotStatus';
      const preview = document.createElement('p');
      preview.className = 'canonicalSlotStatus';
      const applyButton = document.createElement('button');
      applyButton.type = 'button';
      applyButton.textContent = 'このカードを呼び出す';
      const expand = () => bloomSelect.value === '' ? {...expandCanonicalCard(card, selection.levels, dataset.dataset), training: Number(trainingSelect.value), trainingStats: canonicalTrainingStats(card, Number(trainingSelect.value))} : expandCanonicalBloom(card, Number(bloomSelect.value), dataset.dataset, Number(trainingSelect.value));
      const refresh = () => {
        try{
          const expansion = expand();
          basic.textContent = canonicalBasicText(expansion);
          preview.textContent = canonicalEffectsText(expansion);
          applyButton.disabled = false;
        }catch(error){
          preview.textContent = `現在の入力欄へ展開できません：${error.message}`;
          applyButton.disabled = true;
        }
      };
      bloomSelect.addEventListener('change', refresh);
      trainingSelect.addEventListener('change', refresh);
      applyButton.addEventListener('click', () => {
        try{
          const expansion = expand();
          apply(card, expansion.levels.active, expansion);
          closeCanonicalCardPicker();
        }catch(error){ status.textContent = `呼び出せませんでした：${error.message}`; }
      });
      controls.append(preview, applyButton);
      selectedPanel.append(basic, controls);
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
    if(selection && rows.some(row => row.card.id === selection.cardId)){ choice.value = selection.cardId; renderSelected(); }
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
