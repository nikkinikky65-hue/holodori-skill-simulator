"""Audit the display-only predicate against complete Canonical target facts."""
from pathlib import Path
import subprocess,tempfile
ROOT=Path(__file__).resolve().parent.parent
source=(ROOT/'card-catalog.js').read_text().replace('const cardCatalogReady = renderCardCatalog();','')
source+='\n'+(ROOT/'tests/catalog-passive-filter.test.js').read_text()
with tempfile.NamedTemporaryFile(mode='w',suffix='.js') as handle:
    handle.write(source);handle.flush()
    subprocess.run(['/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc',handle.name],cwd=ROOT,check=True)
