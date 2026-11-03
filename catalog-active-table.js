const CatalogActiveTable = {mount:root=>CatalogComparisonTable.mount(root,{
 title:'Active比較',caption:'Activeのマスター値（周期短縮・編成補正なし）',
 note:'開花に応じたActiveレベルを表示します。初期は開花0、最大は開花5、保存なしは初期値です。特訓はActiveに影響しません。発動確率はマスターの‰値を%表示したものです。効果量は同じ種類の基本・条件付き効果の最大値です。条件の成立判定・重複・上書き・期待値計算は行いません。',
 columns:[['interval','発動周期'],['time','効果時間'],['amount','効果量'],['probability','発動確率'],['conditions','条件文']],
 numeric:['interval','time','amount','probability'],project:CatalogActiveData.project
})};
