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
    const cardNodes = entries.map(({row,card}) => {
      const article = skillBlock(row); article.dataset.cardId = card.id;
      const heading = document.createElement('h2'); heading.textContent = card.name;
      const info = document.createElement('p');
      info.textContent = `${canonicalMemberName(card)} / ★${card.classification.rarity.mapping.value} / 衣装：${row.costumeName || '名称未収録'}`;
      article.prepend(heading, info);
      return article;
    });
    const commonNodes = [...leaders.commonEffects].sort((a,b)=>(order.get(a.memberId) ?? 999)-(order.get(b.memberId) ?? 999)).map(row => {
      const article = skillBlock(row);
      const heading = document.createElement('h3'); heading.textContent = `${row.memberName} / ${row.costumeName}`;
      article.prepend(heading);
      return article;
    });
    container.replaceChildren(...cardNodes); common.replaceChildren(...commonNodes);
    status.textContent = `カード固有 ${cardNodes.length}件 / 共通効果 ${commonNodes.length}件。★3のカード固有衣装への参照は取得データにありません。`;
  }catch(error){ status.textContent = `リーダースキル一覧を表示できませんでした：${error.message}`; status.dataset.error = 'true'; }
}
const leaderCatalogReady = renderLeaderCatalog();
