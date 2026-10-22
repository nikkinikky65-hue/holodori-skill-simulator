"""Strict approval policy and historical saved-selection compatibility checks."""
import copy
import json
from pathlib import Path
import sys
import unittest
ROOT=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(ROOT/'research'))
from card_update_integrity import compare_previous, snapshot_baseline, compatible_selections


class ReleaseIntegrity(unittest.TestCase):
    def setUp(self):
        self.card={'id':'c1','skills':{'active':{'levels':[{'description':' Score +10','raw':{'value':10}}]}}}
        self.canonical={'sourceDataset':{'commitSha':'a'*40},'cards':[{'sourceCard':{'sourceId':'c1'},'classification':{},'progression':{},'skills':{'active':{'levels':[]}},'sourceFieldFacts':[]}],
          'sourceRecords':[{'table':'LangGeneratedLiveActiveSkillLevel_Jpn','sourceId':'t1','fields':{'id':'t1','text':' Score +10'},'sourceWrapper':{'id':'t1','text':' Score +10'}}]}
        self.runtime={'dataset':{'canonicalSha256':'old','version':'v1','compatibleSelections':[{'canonicalSha256':'older','sourceCommit':'oldcommit','runtimeVersions':['v0'],'cardIds':['c1']}]},'cards':[self.card]}

    def test_only_explicit_ascii_leading_space_allowed(self):
        new=copy.deepcopy(self.canonical)
        for bag in ('fields','sourceWrapper'):new['sourceRecords'][0][bag]['text']='Score +10'
        self.assertFalse(compare_previous(self.canonical,new,self.runtime,self.runtime)['passed'])
        self.assertTrue(compare_previous(self.canonical,new,self.runtime,self.runtime,True)['passed'])
        new['sourceRecords'][0]['fields']['text']='Score +11'
        self.assertFalse(compare_previous(self.canonical,new,self.runtime,self.runtime,True)['passed'])

    def test_non_text_source_change_blocked(self):
        new=copy.deepcopy(self.canonical);new['sourceRecords'][0]['fields']['id']='other'
        self.assertFalse(compare_previous(self.canonical,new,self.runtime,self.runtime,True)['passed'])

    def test_missing_source_and_removed_card_blocked(self):
        new=copy.deepcopy(self.canonical);new['sourceRecords']=[]
        self.assertFalse(compare_previous(self.canonical,new,self.runtime,self.runtime,True)['passed'])
        new=copy.deepcopy(self.canonical);new['cards']=[]
        self.assertFalse(compare_previous(self.canonical,new,self.runtime,self.runtime,True)['passed'])

    def test_compatible_versions_inherited_only_after_card_validation(self):
        baseline=snapshot_baseline(self.canonical,self.runtime,True)
        candidate=copy.deepcopy(self.card);candidate['skills']['active']['levels'][0]['description']='Score +10'
        entries=compatible_selections([candidate],[baseline])
        self.assertEqual([e['cardIds'] for e in entries],[['c1'],['c1']])
        candidate['skills']['active']['levels'][0]['raw']['value']=11
        self.assertTrue(all(not e['cardIds'] for e in compatible_selections([candidate],[baseline])))

    def test_text_change_without_permission_not_compatible(self):
        baseline=snapshot_baseline(self.canonical,self.runtime,False)
        candidate=copy.deepcopy(self.card);candidate['skills']['active']['levels'][0]['description']='Score +10'
        self.assertTrue(all(not e['cardIds'] for e in compatible_selections([candidate],[baseline])))

    def test_actual_release_preserves_baseline_and_ids(self):
        runtime=json.loads((ROOT/'data/runtime-cards.json').read_bytes())
        canonical=json.loads((ROOT/'research/canonical-cards.json').read_bytes())
        self.assertEqual({c['id'] for c in runtime['cards']},{c['sourceCard']['sourceId'] for c in canonical['cards']})
        for name in ('185','192'):
            b=json.loads((ROOT/f'research/card-library-baseline-{name}.json').read_bytes())
            selection=next(s for s in runtime['dataset']['compatibleSelections'] if s['canonicalSha256']==b['canonicalSha256'])
            self.assertEqual(set(selection['cardIds']),set(b['runtimeCardDigests']))


if __name__=='__main__':unittest.main()
