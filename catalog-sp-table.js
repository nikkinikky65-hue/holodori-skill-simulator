// SP-specific display configuration; table interactions are shared.
const CatalogSPTable = {mount:root=>CatalogComparisonTable.mount(root,{
 title:'SP比較',
 caption:'SP比較（原データの効果量。編成内での発動・適用結果ではありません）',
 note:'SPに影響する開花のみを切り替えます。初期は開花0、最大は開花5。保存なしは初期値です。特訓はSP性能に影響しません。条件は評価せず併記します。発動率UPはActiveへの補正で、SP自体の発動確率ではありません。',
 columns:[['time','効果時間'],['support','効果量'],['probability','発動率UP（%）'],['life','ライフ回復'],['judgement','判定強化']],
 numeric:['time','support','probability','life'],project:CatalogSPData.project
})};
