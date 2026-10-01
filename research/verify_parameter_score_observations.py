"""Read-only audit of supplied measurements, source association and score fits.
No Runtime/game rule is generated. Uses existing adapter for the Noel check.
"""
import json
import subprocess
import tempfile
from fractions import Fraction
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
report = json.loads((ROOT/'research/parameter-score-observations.json').read_text())
canonical = json.loads((ROOT/'research/canonical-cards.json').read_bytes())
runtime = json.loads((ROOT/'data/runtime-cards.json').read_bytes())
noel = report['cardParameters']['noelRarity3']
association = noel['datasetAssociation']
card = next(c for c in runtime['cards'] if c['id'] == association['cardId'])
full = next(c for c in canonical['cards'] if c['sourceCard']['sourceId'] == card['id'])
keys = ['performance','technique','sense']
weights = [card['progression']['parameterInputs'][k+'PermilMultiply'] for k in keys]
assert weights == association['weights'] and sum(weights) == 1000
matching_levels = []
for row in full['progression']['levelRows']:
    fields = {f['sourceField']: f['rawValue'] for f in row['facts'] if f['source'] == row['source']}
    if [(int(fields['parameterBaseValue'])*w+999)//1000 for w in weights] == noel['base']:
        matching_levels.append(fields['level'])
assert matching_levels == [association['matchingLevel']]
assert next(s for s in card['progression']['statSnapshots'] if s['level'] == association['matchingLevel'])['raw']['parameterBaseValue'] == association['parameterBaseValue']
# Adapter's training=0 snapshot is Lv20 here. This is a verification input,
# not a claim about the user's unreported in-game training stage.
assert card['progression']['trainingStages'][0]['levelCap'] == association['matchingLevel']
js = "const URL=function(p){return p;};const document={baseURI:'http://localhost/',addEventListener:()=>{}};\n"
js += (ROOT/'canonical-card-adapter.js').read_text()
js += '\nconst card='+json.dumps(card, ensure_ascii=False)+';\n'
for bloom, expected in [(0,noel['base']),(4,noel['opening4']),(5,noel['opening5'])]:
    js += f"{{const p=calculateCardParameters(card,0,{bloom});if(JSON.stringify([p.performance,p.technique,p.sense])!==JSON.stringify({json.dumps(expected)}) || p.total!=={sum(expected)}) throw Error('Noel mismatch');}}\n"
with tempfile.NamedTemporaryFile(mode='w',suffix='.js') as f:
    f.write(js);f.flush()
    subprocess.run(['/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc',f.name],check=True)
board = report['board']
assert board['commonPerParameter']*board['parametersPerMember']*board['memberCount'] == board['reportedUnitBoardTotal']
pairs = [(r['totalPower'],r['score']) for r in report['firstNote']['observations']]
coefficient = Fraction(sum(x*y for x,y in pairs),sum(x*x for x,y in pairs))
intervals = {}
for label, lower, upper in [('floor',Fraction(0),Fraction(1)),('ceil',Fraction(-1),Fraction(0)),('nearest_half_up',Fraction(-1,2),Fraction(1,2))]:
    lo = max((y+lower)/x for x,y in pairs)
    hi = min((y+upper)/x for x,y in pairs)
    intervals[label] = {'lower':float(lo),'upper':float(hi),'nonempty':lo<hi,
                        'endpoints':'(lower, upper]' if label=='ceil' else '[lower, upper)'}
ratios = [Fraction(y,x) for x,y in pairs]
print(json.dumps({'NoelAdapterMatches':True,'NoelInferredMatchingLevels':matching_levels,
                  'NoelTotals':[sum(noel[k]) for k in ['base','opening4','opening5']],
                  'boardTotal':board['reportedUnitBoardTotal'],
                  'originLeastSquaresCoefficient':float(coefficient),
                  'ratioRange':[float(min(ratios)),float(max(ratios))],
                  'residuals':[float(Fraction(y)-coefficient*x) for x,y in pairs],
                  'constantCoefficientIntervals':intervals},ensure_ascii=False,indent=2))
