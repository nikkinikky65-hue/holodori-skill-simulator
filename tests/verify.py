"""Read-only static checks and actual save/load handlers with minimal DOM test doubles.
Run: python3 tests/verify.py (macOS JavaScriptCore required).
"""
import re
import subprocess
import tempfile
from pathlib import Path

root = Path(__file__).resolve().parent.parent
jsc = '/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc'
app = (root / 'app.js').read_text()
lib = (root / 'library.js').read_text()
old = subprocess.check_output(['git', 'show', 'HEAD:app.js'], cwd=root, text=True)
for start, end in [('function precalculateParty(', '// 発動頻度UP：'),
                   ('function adjustedInterval(', '// ====='),
                   ('function maxSegments(', 'function render(){'),
                   ('function optimizeShortRates(', 'function renderOptimizedTimeline(')]:
    def section(text):
        a = text.index(start)
        return text[a:text.index(end, a)].strip()
    assert section(app) == section(old), start + ' changed'

for page, script in [('index.html','app.js'),('library.html','library.js'),('event.html','event.js'),('index.html','formation.js'),('index.html','active-snapshot.js')]:
    html = (root / page).read_text()
    ids = set(re.findall(r'id="([\w-]+)"', html))
    source = (root / script).read_text()
    references = set(re.findall(r"querySelector\(\s*['\"]#([\w-]+)['\"]",source))
    generated = set(re.findall(r'id=["\']([\w-]+)["\']',source))
    generated.update(re.findall(r"\.id\s*=\s*['\"]([\w-]+)['\"]",source))
    assert not references - ids - generated, (page, references - ids - generated)
    assert html.index('members.js') < html.index('card-rules.js') < html.index(script)
assert 'cardSaveBloom' not in app + (root/'index.html').read_text()

# Extract actual page handlers, not copies of their implementation.
a = app.index("  () => {", app.index("'#cardSaveConfirm'")) + len('  () => {')
b = app.index('// ライブラリ呼出', a)
save_body = app[a:b].rsplit('  }\n);',1)[0]
a = app.index('function loadLibraryCardIntoSlot(')
b = app.index('function num(',a)
load_function = app[a:b]
a = lib.index('function getMemberCardFormData()')
b = lib.index('// 保存',a)
form_function = lib[a:b]
fields = re.findall(r"const (\w+) =\s*document.querySelector\(\s*'(#\w+)'",lib)
js = (root/'card-rules.js').read_text() + '\n' + '''
const assert = (ok,msg) => {if(!ok) throw Error(msg);};
const stored = new Map();
const localStorage = {getItem:k=>stored.get(k)??null,setItem:(k,v)=>stored.set(k,v)};
const nodes = new Map();
const node = key => {if(!nodes.has(key)) nodes.set(key,{value:''});return nodes.get(key);};
const slot = {querySelector:node};
const document = {querySelector:node,querySelectorAll:()=>[slot]};
let saveTargetSlot=0;
const getMasterMember = id => ({id,name:'test member'});
const loadMemberCardLibrary=readCardLibrary, saveMemberCardLibrary=writeCardLibrary;
const createLibraryCardId=()=> 'test-id';
const saveState=()=>{}, render=()=>{}, closeCardSaveModal=()=>{}, updateOptimizeNames=()=>{}, alert=()=>{};
''' + '\nfunction saveFromA(){'+save_body+'\n}\n'+load_function
js += '\n' + '\n'.join('const '+name+'=node('+repr(selector)+');' for name,selector in fields)
js += '''
let memberCards=[];
function formDerived(){return getCardDerived(Number(cardRarity.value),Number(cardTraining.value),Number(cardBloom.value));}
''' + form_function + '''
node('[data-k="memberId"]').value='tokino_sora';
for(const [id,value] of Object.entries({cardSaveName:'自由な名前',cardSaveType:'cute',cardSaveRarity:5,cardSaveTraining:2,cardSaveInterval:15,cardSaveProbability:'mid',cardSaveDuration:5,cardSaveBoost:20})) node('#'+id).value=String(value);
saveFromA();
let card=readCardLibrary()[0];
assert(card.id==='test-id' && card.progression.level===60 && card.stats.total===22000,'A save');
const shape = value => value && typeof value==='object' ? Object.fromEntries(Object.keys(value).sort().map(k=>[k,shape(value[k])])) : true;
const initialShape=JSON.stringify(shape(card));
card.extensions.future=42;card.skills.active.future='keep';
memberCards=[card];
const values={memberCardId:card.id,cardTalent:card.talentId,cardName:'編集後',cardType:card.type,cardRarity:5,cardTraining:2,cardBloom:5,cardTotal:22001,cardPerformance:7401,cardTechnique:7300,cardSense:7300,activeSkillInterval:15,activeSkillProb:'mid',activeSkillDuration:5,activeSkillBoost:25};
for(const [id,value] of Object.entries(values))node('#'+id).value=String(value);
const edited=getMemberCardFormData();
assert(edited.id===card.id && edited.progression.bloom===5 && edited.stats.total===22001,'Library edit');
assert(edited.extensions.future===42 && edited.skills.active.future==='keep','Library metadata');
writeCardLibrary([edited]);loadLibraryCardIntoSlot(edited,0);
assert(node('[data-k="costume"]').value==='編集後','load custom name');
assert(node('[data-k="libraryCardId"]').value===card.id,'load id');
assert(node('[data-k="boost"]').value===25,'load active');
saveFromA();
card=readCardLibrary()[0];
assert(readCardLibrary().length===1 && card.progression.bloom===5 && card.stats.total===22001,'A resave');
assert(card.extensions.future===42 && card.skills.active.future==='keep','A metadata');
delete card.extensions.future;delete card.skills.active.future;
assert(JSON.stringify(shape(card))===initialShape,'same schema');
// Blank quick-save defaults and explicit names; updates keep existing names.
writeCardLibrary([]);
node('[data-k="libraryCardId"]').value='';
node('[data-k="costume"]').value='   ';
node('#cardSaveName').value='   ';
saveFromA();
assert(readCardLibrary()[0].cardName==='未分類','blank new name default');
assert(node('[data-k="costume"]').value==='未分類','blank costume default');
node('#cardSaveName').value='正式名';saveFromA();
node('#cardSaveName').value='';node('[data-k="costume"]').value='未分類';saveFromA();
assert(readCardLibrary()[0].cardName==='正式名','blank update preserves existing name');
writeCardLibrary([]);node('[data-k="libraryCardId"]').value='';
node('[data-k="costume"]').value='明示した衣装';saveFromA();
assert(readCardLibrary()[0].cardName==='明示した衣装','explicit costume wins over default');
node('#cardSaveName').value='明示したカード名';saveFromA();
assert(readCardLibrary()[0].cardName==='明示したカード名','explicit card name wins');
// Missing nested properties can be opened without resetting saved stats.
writeCardLibrary([{id:'partial',stats:{total:123},skills:{active:null}}]);
assert(readCardLibrary()[0].skills.active.interval===0 && readCardLibrary()[0].stats.total===123,'partial card');
print('Actual A save → Library edit → A load/resave handlers: PASS');
'''
# Compare old/new score and segments for overlapping and frequency-adjusted skills.
import json
for label, source in [('before',old),('after',app)]:
    a=source.index('function adjustedInterval(')
    b=source.index('// =====',a)
    c=source.index('function maxSegments(')
    d=source.index('function render(){',c)
    body=source[a:b]+source[c:d]+"\nreturn {events,calcMax,maxSegments};"
    js += '\nconst '+label+' = new Function('+json.dumps(body)+')();'
js += """
for(const T of [1,15,120,123.45]){
  for(const short of [0,4,8,12]){
    const members=[{slot:1,interval:15,duration:5,boost:20,short},{slot:2,interval:17,duration:9,boost:30,short:8}];
    const a=members.flatMap(m=>before.events(m,T)),b=members.flatMap(m=>after.events(m,T));
    assert(JSON.stringify(a)===JSON.stringify(b),'unchanged events');
    assert(before.calcMax(a,T)===after.calcMax(b,T),'unchanged score');
    assert(JSON.stringify(before.maxSegments(a,T))===JSON.stringify(after.maxSegments(b,T)),'unchanged segments');
  }
}
assert(after.calcMax(after.events({interval:15,duration:5,boost:20,short:0},120),120)===700,'known score');
localStorage.setItem(MEMBER_CARD_STORAGE_KEY, '{bad json');
let refused=false;
try{writeCardLibrary([]);}catch(e){refused=true;}
assert(refused && localStorage.getItem(MEMBER_CARD_STORAGE_KEY)==='{bad json','invalid storage preserved');
print('Score/segments regression and invalid-storage preservation: PASS');
"""
for name in ['app.js','library.js','event.js','members.js','card-rules.js','formation-rules.js','formation.js','active-snapshot.js']:
    js += '\nnew Function(readFile('+repr(str(root/name))+'));'
js += "\nprint('All JavaScript syntax: PASS');"
with tempfile.NamedTemporaryFile(mode='w',suffix='.js') as f:
    f.write(js);f.flush()
    subprocess.run([jsc,f.name],check=True,cwd=root)
subprocess.run([jsc,'card-rules.js','tests/card-rules.test.js'],check=True,cwd=root)
print('DOM IDs, script order, unchanged Passive/optimizer/timeline evaluation functions: PASS')

subprocess.run([jsc,'formation-rules.js','tests/formation-rules.test.js'],check=True,cwd=root)
