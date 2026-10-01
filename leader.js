// Read-only listing. Never writes user settings or builds executable skill data.
async function renderLeaderCatalog(){
  const status = document.querySelector('#leaderStatus');
  try{
    const [cards, response] = await Promise.all([
      loadRuntimeCardCatalog(), fetch(new URL('data/runtime-leader-skills.json', document.baseURI))
    ]);
    if(!response.ok) throw Error(`leader catalog load failed: ${response.status}`);
    const leaders = await response.json();
    if(leaders.format !== 'holodori-leader-catalog-v1' || leaders.dataset.canonicalSha256 !== cards.dataset.canonicalSha256 ||
       !Array.isArray(leaders.cardSkills) || !Array.isArray(leaders.commonEffects)) throw Error('リーダーデータの形式・参照元が一致しません。');
    const byId = new Map(cards.cards.map(card => [card.id, card]));
    const order = new Map(HOLO_MEMBERS.map((member, i) => [member.id, i]));
    const container = document.querySelector('#leaderCards');
    const common = document.querySelector('#leaderCommon');
    const text = value => value.replace(/\[[^\]]+\]/g, '');
    const skillBlock = row => {
      const article = document.createElement('article'); article.className = 'panel leaderSkill';
      article.dataset.leaderSkillId = row.skillId;
      const name = document.createElement('p'); name.textContent = `リーダースキル名：${row.name || '名称未収録'}`;
      const description = document.createElement('p'); description.className = 'leaderDescription';
      description.textContent = text(row.description);
      article.append(name, description);
      return article;
    };
    const entries = leaders.cardSkills.map(row => {
      const card = byId.get(row.cardId);
      if(!card) throw Error(`対応カードが見つかりません：${row.cardId}`);
      return {row, card};
    }).sort((a,b) => (order.get(canonicalMemberId(a.card)) ?? 999) - (order.get(canonicalMemberId(b.card)) ?? 999) ||
      b.card.classification.rarity.mapping.value - a.card.classification.rarity.mapping.value);
    const categories = ['センスUP', 'テクニックUP', 'パフォーマンスUP', '全パラメータUP', 'スコアサポート', '複合効果', '未分類'];
    const groups = new Map(categories.map(label => [label, new Map()]));
    const cardNodes = entries.map(({row,card}) => {
      const article = document.createElement('article'); article.className = 'leaderSkill leaderEntry';
      article.dataset.cardId = card.id; article.dataset.leaderSkillId = row.skillId;
      const view = row.presentation;
      const effects = view?.status === 'classified' ? view.effects : [];
      const category = groups.has(view?.category) ? view.category : '未分類';
      const amountLabel = effects.length > 1
        ? effects.map(effect => `${effect.label} ${effect.amountPercent}%`).join(' ＋ ')
        : effects.length ? `${effects[0].amountPercent}%` : '原文を確認';
      const conditions = [...new Set(effects.map(effect => effect.conditionText).filter(Boolean))];
      const info = document.createElement('p'); info.className = 'leaderIdentity';
      info.textContent = `${canonicalMemberName(card)}${conditions.length === 1 ? `（${conditions[0]}）` : ''}［${card.name}］`;
      article.append(info);
      // Different conditions stay attached to their own effects, never combined into one condition.
      if(conditions.length > 1 || (conditions.length && effects.some(effect => !effect.conditionText))){
        info.textContent = `${canonicalMemberName(card)}［${card.name}］`;
        for(const effect of effects){
          const line = document.createElement('p'); line.className = 'leaderEffectCondition';
          line.textContent = `${effect.label} ${effect.amountPercent}%${effect.conditionText ? `（${effect.conditionText}）` : ''}`;
          article.append(line);
        }
      }
      const details = document.createElement('details');
      const summary = document.createElement('summary'); summary.textContent = '効果原文・カード情報';
      const metadata = document.createElement('p');
      metadata.textContent = `★${card.classification.rarity.mapping.value} / 衣装：${row.costumeName || '名称未収録'} / リーダースキル名：${row.name || '名称未収録'}`;
      const description = document.createElement('p'); description.className = 'leaderDescription'; description.textContent = text(row.description);
      details.append(summary, metadata, description); article.append(details);
      if(category === '未分類') details.open = true;
      const amounts = groups.get(category);
      if(!amounts.has(amountLabel)) amounts.set(amountLabel, {effects, nodes: []});
      amounts.get(amountLabel).nodes.push(article);
      return article;
    });
    const groupNodes = [];
    for(const [category, amounts] of groups){
      if(!amounts.size) continue;
      const section = document.createElement('section'); section.className = 'panel leaderCategory'; section.dataset.category = category;
      const heading = document.createElement('h2');
      heading.textContent = `${category}（${[...amounts.values()].reduce((sum, group) => sum + group.nodes.length, 0)}件）`;
      section.append(heading);
      const sorted = [...amounts].sort(([labelA,a], [labelB,b]) => {
        if(category !== '複合効果') return (b.effects[0]?.amountPercent ?? 0) - (a.effects[0]?.amountPercent ?? 0);
        return (a.effects[0]?.label || '').localeCompare(b.effects[0]?.label || '', 'ja') ||
          (b.effects[0]?.amountPercent ?? 0) - (a.effects[0]?.amountPercent ?? 0) || labelA.localeCompare(labelB, 'ja');
      });
      for(const [label, group] of sorted){
        const block = document.createElement('details'); block.className = 'leaderAmount'; block.open = true;
        const summary = document.createElement('summary');
        const title = document.createElement('h3'); title.textContent = label;
        summary.append(title); block.append(summary, ...group.nodes); section.append(block);
      }
      groupNodes.push(section);
    }
    const commonNodes = [...leaders.commonEffects].sort((a,b)=>(order.get(a.memberId) ?? 999)-(order.get(b.memberId) ?? 999)).map(row => {
      const article = skillBlock(row);
      const heading = document.createElement('h3'); heading.textContent = `${row.memberName} / ${row.costumeName}`;
      article.prepend(heading);
      return article;
    });
    container.replaceChildren(...groupNodes); common.replaceChildren(...commonNodes);
    status.textContent = `カード固有 ${cardNodes.length}件 / 共通効果 ${commonNodes.length}件。★3のカード固有衣装への参照は取得データにありません。`;
  }catch(error){ status.textContent = `リーダースキル一覧を表示できませんでした：${error.message}`; status.dataset.error = 'true'; }
}
const leaderCatalogReady = renderLeaderCatalog();
