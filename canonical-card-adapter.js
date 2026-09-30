// Canonical fixture -> existing manual slot inputs only.
// This is a UI adapter; it does not mutate the Canonical fixture/schema or Library.
const CANONICAL_FIXTURE_URL = new URL('research/canonical-card-sakura-bloom.fixture.json', document.baseURI);
let canonicalFixturePromise = null;

function loadCanonicalCardFixture(){
  if(!canonicalFixturePromise){
    canonicalFixturePromise = fetch(CANONICAL_FIXTURE_URL)
      .then(response => {
        if(!response.ok) throw new Error(`fixture load failed: ${response.status}`);
        return response.json();
      })
      .then(fixture => {
        if(fixture.proposalStatus !== 'proposal-not-implemented' ||
           !Array.isArray(fixture.cards) || fixture.cards.length !== 1){
          throw new Error('Canonical PoC fixture shape is unexpected.');
        }
        return fixture;
      });
  }
  return canonicalFixturePromise;
}

function canonicalRawFact(facts, sourceField){
  return (facts || []).find(fact => fact?.sourceField === sourceField)?.rawValue;
}

function canonicalSkillText(level){
  const fact = (level?.facts || []).find(item => item?.sourceField === 'text' &&
    item?.source?.table?.startsWith('LangGeneratedLiveActiveSkillLevel_'));
  return typeof fact?.rawValue === 'string' ? fact.rawValue : '';
}

function canonicalNumber(value){
  if(value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function adaptCanonicalCardToActiveInput(card, levelNumber){
  const level = card?.skills?.active?.levels?.find(item => Number(item.levelFact?.rawValue) === Number(levelNumber));
  if(!level) throw new Error('Selected Canonical Active level was not found.');

  const name = card.identity?.names?.find(item => item.locale === 'ja-JP')?.textFact?.rawValue || '';
  const memberFact = card.identity?.memberFacts?.find(item => item.sourceField === 'nameEng');
  const talentId = memberFact?.semanticCandidate?.value;
  const cycleMs = canonicalNumber(canonicalRawFact(level.facts, 'coolTimeMillisecond'));
  const durationMs = canonicalNumber(canonicalRawFact(level.facts, 'effectDurationMillisecond'));
  const activationDescription = canonicalSkillText(level);
  const probability = activationDescription.includes('中確率') ? 'mid'
    : activationDescription.includes('高確率') ? 'high'
    : activationDescription.includes('低確率') ? 'low'
    : '';

  const effectType = canonicalRawFact(level.baseEffect?.facts, 'type');
  const rawValue = canonicalRawFact(level.baseEffect?.facts, 'value');
  // Explicit adapter mapping already documented by the one-card PoC: the source
  // permil-up effect's localized displayed percentage is the manual boost value.
  const boost = effectType === 'LiveActiveSkillEffectType_LIVE_ACTIVE_SKILL_EFFECT_TYPE_SCORE_UP_PERMIL_UP'
    && canonicalNumber(rawValue) !== null
    ? canonicalNumber(rawValue) / 10
    : null;

  if(!name || !talentId || cycleMs === null || durationMs === null || !probability || boost === null){
    throw new Error('This fixture has a field that cannot be mapped to the current Active inputs.');
  }

  const hasConditionalOverride = (level.conditionalOverrides || []).length > 0;
  return {
    canonicalCardId: card.sourceCard?.sourceId || '',
    level: Number(level.levelFact.rawValue),
    memberId: talentId,
    costume: name,
    interval: cycleMs / 1000,
    probability,
    duration: durationMs / 1000,
    boost,
    conditionalOverrideCount: (level.conditionalOverrides || []).length,
    warnings: [
      '効果値は既存PoCの候補対応（raw valueを既存%欄へ表示）です。Canonical raw valueは変更せず、ゲーム内計算規則として確定していません。',
      ...(hasConditionalOverride ? ['条件付き上位効果は現行Active入力・Timelineで扱えないため、base effectのみを入力しました。条件成立時は置換となり、加算ではありません。'] : []),
      'この呼び出しは手入力欄へ値を展開しただけです。Canonical/Libraryへの保存は行っていません。'
    ]
  };
}

// Runtime view only: raw selected levels and provenance remain separate from
// the only executable projection (Active base effect). Never normalize to Card v2.
function expandCanonicalCard(card, levels, dataset = null){
  const copy = value => JSON.parse(JSON.stringify(value));
  const selected = {};
  for(const kind of ['passive', 'active', 'special']){
    const level = card.skills?.[kind]?.levels?.find(item => Number(item.levelFact.rawValue) === Number(levels[kind]));
    if(!level) throw new Error(`${kind}のレベルを選択してください。`);
    selected[kind] = copy(level);
  }
  return {
    source: { card: copy(card.sourceCard), dataset: dataset ? copy(dataset) : null },
    basic: { identity: copy(card.identity), classification: copy(card.classification) },
    levels: Object.fromEntries(Object.entries(selected).map(([kind, level]) => [kind, Number(level.levelFact.rawValue)])),
    passive: { data: selected.passive, conditionStatus: 'unresolved', calculationStatus: 'deferred' },
    active: { data: selected.active, calculationStatus: 'base-only' },
    special: { data: selected.special, durationMilliseconds: canonicalRawFact(selected.special.facts, 'effectDurationMillisecond'), durationScope: 'unresolved-per-effect', calculationStatus: 'display-only' },
    activeInput: adaptCanonicalCardToActiveInput(card, levels.active),
    unresolved: [
      'Passive：条件未確認。条件なしとは扱わず、計算適用を保留します。',
      'Special：複数効果とスキル全体の時間を保持。効果ごとの時間適用は未確認です。発動頻度UP・常時Score Supportには適用しません。',
      'メンバー・属性・レア度のruntime対応は既存PoCの候補です。育成状態や最終ステータスは推定しません。'
    ]
  };
}

function canonicalExpansionText(expansion){
  const text = level => (level.facts || []).filter(fact => fact.sourceField === 'text').map(fact => String(fact.rawValue).replace(/\[[^\]]+\]/g, '')).join('\n');
  return [
    `${expansion.activeInput.costume} / P Lv.${expansion.levels.passive}・A Lv.${expansion.levels.active}・SP Lv.${expansion.levels.special}`,
    `メンバー候補：${expansion.activeInput.memberId} / 属性・レア度候補：${expansion.basic.classification.map(fact => fact.semanticCandidate?.value ?? fact.rawValue).join(' / ')}`,
    `Passive：${text(expansion.passive.data)}`,
    `Active：${text(expansion.active.data)}`,
    `Special：${text(expansion.special.data)}`,
    `Special持続時間（スキルレベル行）：${expansion.special.durationMilliseconds / 1000}秒。個別効果への割当は未確認。`,
    ...expansion.activeInput.warnings, ...expansion.unresolved,
    '呼出元の情報です。Active手入力の変更はこの表示に反映しません。',
    `出典：${expansion.source.card.sourceId} / ${expansion.source.dataset?.repository || ''} / ${expansion.source.dataset?.commitSha || ''}`
  ].join('\n');
}

function showCanonicalExpansion(target, expansion){
  if(target) target.textContent = expansion ? canonicalExpansionText(expansion) : '';
}

function adaptCanonicalCardToEventCard(card, levelNumber, expansion = null){
  const active = adaptCanonicalCardToActiveInput(card, levelNumber);
  return {
    id: `canonical:${active.canonicalCardId}:lv${active.level}` + (expansion ? `:p${expansion.levels.passive}:s${expansion.levels.special}` : ''),
    canonicalExpansion: expansion,
    sourceCardId: active.canonicalCardId,
    sourceKind: 'canonical-fixture',
    talentId: active.memberId,
    cardName: active.costume,
    type: card.classification?.find(fact => fact.sourceField === 'attributeType')?.semanticCandidate?.value || '',
    rarity: card.classification?.find(fact => fact.sourceField === 'rarity')?.semanticCandidate?.value || null,
    skills: {
      active: {
        interval: active.interval,
        probability: active.probability,
        duration: active.duration,
        boost: active.boost
      }
    },
    canonicalWarnings: active.warnings
  };
}

// Shared fixture chooser. `apply` receives a freshly adapted current-input value.
async function openCanonicalCardPicker({targetText, apply}){
  const modal = document.querySelector('#canonicalCardModal');
  const status = document.querySelector('#canonicalCardStatus');
  const cardList = document.querySelector('#canonicalCardList');
  const target = document.querySelector('#canonicalCardTarget');
  if(!modal || !status || !cardList || !target) return;

  target.textContent = targetText || '';
  status.textContent = 'Canonical fixtureを読み込み中…';
  cardList.replaceChildren();
  modal.hidden = false;

  try{
    const fixture = await loadCanonicalCardFixture();
    status.textContent = '公開済みカードfixture（PoC）';
    fixture.cards.forEach(card => {
      const row = document.createElement('div');
      row.className = 'canonicalCardChoice';
      const title = document.createElement('strong');
      title.textContent = card.identity?.names?.find(item => item.locale === 'ja-JP')?.textFact?.rawValue || card.sourceCard.sourceId;
      const source = document.createElement('span');
      source.textContent = `${card.sourceCard.sourceId} / Library未登録・fixture 1枚のみ`;
      const controls = document.createElement('div');
      controls.className = 'canonicalCardChoiceControls';
      const selectors = {};
      const preview = document.createElement('p');
      preview.className = 'canonicalSlotStatus';
      const expand = () => expandCanonicalCard(card, Object.fromEntries(Object.entries(selectors).map(([kind, select]) => [kind, Number(select.value)])), fixture.sourceDataset);
      for(const [kind, label] of [['passive', 'Passive'], ['active', 'Active'], ['special', 'Special']]){
        const levelLabel = document.createElement('label');
        levelLabel.textContent = `${label}レベル（個別指定）`;
        const select = document.createElement('select');
        select.dataset.canonicalSkill = kind;
        if(kind === 'active') select.dataset.canonicalLevel = '';
        for(const level of card.skills[kind].levels){
          const option = document.createElement('option');
          option.value = String(level.levelFact.rawValue);
          option.textContent = `Lv.${level.levelFact.rawValue}`;
          select.append(option);
        }
        selectors[kind] = select;
        select.addEventListener('change', () => showCanonicalExpansion(preview, expand()));
        levelLabel.append(select);
        controls.append(levelLabel);
      }
      showCanonicalExpansion(preview, expand());
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'このカードを呼び出す';
      button.addEventListener('click', () => {
        try{
          const expansion = expand();
          apply(card, expansion.levels.active, expansion);
          closeCanonicalCardPicker();
        }catch(error){
          status.textContent = `呼び出せませんでした: ${error.message}`;
        }
      });
      controls.append(button);
      const warning = document.createElement('p');
      warning.className = 'sub canonicalCardWarning';
      warning.textContent = '条件付きActive上位値は現在の入力欄で表現・計算しません。呼出後は表示される注意を確認してください。';
      row.append(title, source, controls, preview, warning);
      cardList.append(row);
    });
  }catch(error){
    status.textContent = `Canonical fixtureを読めませんでした。HTTPでページを開いてください。${error.message}`;
  }
}

function closeCanonicalCardPicker(){
  const modal = document.querySelector('#canonicalCardModal');
  if(modal) modal.hidden = true;
}

document.addEventListener('click', event => {
  if(event.target.closest('[data-close-canonical-card-modal]')) closeCanonicalCardPicker();
});
