"""Read-only card active projection versus the existing detail adapter."""
from pathlib import Path
import subprocess,tempfile
root=Path(__file__).resolve().parent.parent
files=['members.js','canonical-card-adapter.js','catalog-comparison-order.js','skill-description-text.js','catalog-active-data.js','tests/catalog-active.test.js']
with tempfile.NamedTemporaryFile(mode='w',suffix='.js') as f:
    f.write("const URL=function(p,b){return p;}; const document={baseURI:'http://localhost/',addEventListener:()=>{}};\n")
    f.write('\n'.join((root/name).read_text() for name in files));f.flush()
    subprocess.run(['/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc',f.name],cwd=root,check=True)
