"""Run comparison projection tests against the actual shared engines (macOS JSC)."""
from pathlib import Path
import subprocess
import tempfile
ROOT=Path(__file__).resolve().parent.parent
JSC='/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc'
files=['members.js','canonical-card-adapter.js','card-rules.js','parameter-rules.js',
       'active-timeline-engine.js','activation-probability-rules.js','active-random-simulation.js',
       'party-condition-resolver.js','active-conditional-rules.js','passive-target-resolver.js',
       'passive-selection-resolver.js','leader-parameter-engine.js','unit-parameter-engine.js',
       'unit-score-engine.js','support-rules.js','special-schedule-engine.js','scheduled-support-engine.js',
       'activation-probability-engine.js','leader-support-engine.js','unit-simulator-engine.js',
       'unit-parameter-comparison.js','tests/unit-parameter-comparison.test.js']
source="const URL=function(p,b){return p;}; const document={baseURI:'http://localhost/',addEventListener:()=>{}};\n"
source+='\n'.join((ROOT/name).read_text() for name in files)
with tempfile.NamedTemporaryFile(mode='w',suffix='.js') as handle:
    handle.write(source);handle.flush()
    subprocess.run([JSC,handle.name],cwd=ROOT,check=True)
