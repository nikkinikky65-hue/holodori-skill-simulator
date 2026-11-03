const CatalogStatusTable = {mount:root=>CatalogComparisonTable.mount(root,{
 sortNote:'数値列は昇順・降順で比較できます。計算できない項目は「—」とし、ソート時は末尾に表示します。',
 title:'ステータス比較',caption:'カード単体のP・T・S・TOTAL（編成補正なし）',training:true,
 note:'詳細表示と同じ計算です。初期は特訓0・開花0、最大は特訓4・開花5。各特訓段階のLv上限を使用します。保存なしは初期値。カスタムでは開花と特訓を個別に選択します。編成・メモリー・ボード・衣装補正は含みません。',
 columns:[['performance','P'],['technique','T'],['sense','S'],['total','TOTAL'],['passive','Passive']],
 numeric:['performance','technique','sense','total'],project:CatalogStatusData.project
})};
