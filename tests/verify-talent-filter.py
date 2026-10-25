"""Read-only talent presentation and affiliation diagnostics against local data."""
from pathlib import Path
import subprocess,tempfile
ROOT=Path(__file__).resolve().parent.parent
files=['members.js','talent-presentation.js','talent-filter.js','tests/talent-filter.test.js']
with tempfile.NamedTemporaryFile(mode='w',suffix='.js') as source:
    source.write('\n'.join((ROOT/name).read_text() for name in files));source.flush()
    subprocess.run(['/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc',source.name],cwd=ROOT,check=True)
