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

function adaptCanonicalCardToEventCard(card, levelNumber){
  const active = adaptCanonicalCardToActiveInput(card, levelNumber);
  return {
    id: `canonical:${active.canonicalCardId}:lv${active.level}`,
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
      const levelLabel = document.createElement('label');
      levelLabel.textContent = 'Activeレベル';
      const levelSelect = document.createElement('select');
      levelSelect.dataset.canonicalLevel = '';
      (card.skills?.active?.levels || []).forEach(level => {
        const option = document.createElement('option');
        option.value = String(level.levelFact.rawValue);
        option.textContent = `Lv.${level.levelFact.rawValue}`;
        levelSelect.append(option);
      });
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'このカードを呼び出す';
      button.addEventListener('click', () => {
        try{
          apply(card, Number(levelSelect.value));
          closeCanonicalCardPicker();
        }catch(error){
          status.textContent = `呼び出せませんでした: ${error.message}`;
        }
      });
      levelLabel.append(levelSelect);
      controls.append(levelLabel, button);
      const warning = document.createElement('p');
      warning.className = 'sub canonicalCardWarning';
      warning.textContent = '条件付きActive上位値は現在の入力欄で表現・計算しません。呼出後は表示される注意を確認してください。';
      row.append(title, source, controls, warning);
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
