"""Verify diagnostic-only ID reporting without altering the audited expectation."""
import json
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
JSC = '/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc'


class PartyDiagnosticsTests(unittest.TestCase):
    def run_case(self, expected, actual):
        source = (ROOT/'tests/party-condition.test.js').read_text()
        start = source.index('if(JSON.stringify(enabled)!==JSON.stringify(expected))')
        end = source.index('\nconst gateCounts=', start)
        code = ('const check=(ok,msg)=>{if(!ok)throw Error(msg);};\n'
                f'const expected={json.dumps(expected)},enabled={json.dumps(actual)};\n'
                + source[start:end])
        with tempfile.NamedTemporaryFile(mode='w', suffix='.js') as handle:
            handle.write(code);handle.flush()
            result = subprocess.run([JSC,handle.name],capture_output=True,text=True)
        return result

    def run_scoped_case(self, expected, actual, baseline):
        source = (ROOT/'tests/party-condition.test.js').read_text()
        start = source.index('const enabled=enabledAll.filter')
        end = source.index('\nconst gateCounts=', start)
        code = ('const check=(ok,msg)=>{if(!ok)throw Error(msg);};\n'
                f'const expected={json.dumps(expected)},enabledAll={json.dumps(actual)};\n'
                f'const releaseBaselineIds=new Set({json.dumps(baseline)});\n'
                + source[start:end])
        with tempfile.NamedTemporaryFile(mode='w', suffix='.js') as handle:
            handle.write(code);handle.flush()
            return subprocess.run([JSC,handle.name],capture_output=True,text=True)

    def test_new_matching_card_does_not_change_old_audit(self):
        self.assertEqual(self.run_scoped_case(['a'],['a','new'],['a','old-other']).returncode,0)

    def test_missing_audited_card_still_fails(self):
        self.assertNotEqual(self.run_scoped_case(['a'],['new'],['a','old-other']).returncode,0)

    def test_old_card_newly_matching_still_fails(self):
        self.assertNotEqual(self.run_scoped_case(['a'],['a','old-other','new'],['a','old-other']).returncode,0)

    def test_baseline_cannot_drop_expected_ids(self):
        self.assertNotEqual(self.run_scoped_case(['a'],['a'],['old-other']).returncode,0)

    def test_equal_success_no_diagnostic(self):
        result=self.run_case(['a','b'],['a','b'])
        self.assertEqual(result.returncode,0)
        self.assertNotIn('REGRESSION_DIAGNOSTIC',result.stdout)

    def test_added_and_missing_fail_with_exact_lists(self):
        result=self.run_case(['a','b'],['b','c'])
        self.assertNotEqual(result.returncode,0)
        data=json.loads(result.stdout.splitlines()[0].removeprefix('REGRESSION_DIAGNOSTIC '))
        self.assertEqual(data['expected'],['a','b'])
        self.assertEqual(data['actual'],['b','c'])
        self.assertEqual(data['added'],['c'])
        self.assertEqual(data['missing'],['a'])
        self.assertIn('exact audited 12',result.stdout)

    def test_order_mismatch_still_fails(self):
        result=self.run_case(['a','b'],['b','a'])
        self.assertNotEqual(result.returncode,0)
        data=json.loads(result.stdout.splitlines()[0].removeprefix('REGRESSION_DIAGNOSTIC '))
        self.assertTrue(data['orderOnly'])
        self.assertEqual(data['added'],[])
        self.assertEqual(data['missing'],[])


if __name__=='__main__':unittest.main()
