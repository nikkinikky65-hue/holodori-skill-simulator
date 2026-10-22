"""Semantic digest ignores only Canonical pointer locations, not game values."""
import hashlib,json

def runtime_card_digest(card):
    def clean(x):
        if isinstance(x,list):return [clean(v) for v in x]
        if isinstance(x,dict):return {k:clean(v) for k,v in x.items() if k!='source'}
        return x
    return hashlib.sha256(json.dumps(clean(card),sort_keys=True,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()


def active_text_digest(value):
    """Ignore only leading ASCII spaces in observed Active descriptions."""
    import copy
    value = copy.deepcopy(value)
    if 'skills' in value:
        for level in value['skills']['active']['levels']:
            if 'description' in level:
                level['description'] = level['description'].lstrip(' ')
    def walk(node):
        if isinstance(node, dict):
            if ((node.get('source') if isinstance(node.get('source'), dict) else {}).get('table') == 'LangGeneratedLiveActiveSkillLevel_Jpn'
                    and node.get('sourceField') == 'text' and isinstance(node.get('rawValue'), str)):
                node['rawValue'] = node['rawValue'].lstrip(' ')
            for child in node.values(): walk(child)
        elif isinstance(node, list):
            for child in node: walk(child)
    walk(value)
    return runtime_card_digest(value)


def compatible_selections(cards, baselines):
    """Carry old selectors only through per-card semantic checks, never by count."""
    by_id = {card['id']: card for card in cards}
    result = {}
    def add(entry, allowed):
        key = entry['canonicalSha256']
        if key not in result:
            result[key] = {**entry, 'cardIds': []}
        result[key]['cardIds'] = sorted(set(result[key]['cardIds']) | set(allowed))
    for baseline in baselines:
        exact = baseline['runtimeCardDigests']
        approved = baseline.get('activeTextDigests', {})
        allowed = [key for key, card in by_id.items() if
                   exact.get(key) == runtime_card_digest(card) or
                   (baseline.get('permittedSourceChanges') == ['active-description-leading-ascii-space']
                    and approved.get(key) == active_text_digest(card))]
        add({'canonicalSha256': baseline['canonicalSha256'],
             'sourceCommit': baseline['sourceDataset']['commitSha'],
             'runtimeVersions': baseline['runtimeVersions']}, allowed)
        for inherited in baseline.get('inheritedCompatibleSelections', []):
            add(inherited, set(inherited['cardIds']) & set(allowed))
    return list(result.values())


def snapshot_baseline(canonical, runtime, allow_active_leading_space=False):
    gameplay = lambda card: {k: card[k] for k in ['classification','progression','skills','sourceFieldFacts']}
    result = {
        'sourceDataset': canonical['sourceDataset'],
        'canonicalSha256': runtime['dataset']['canonicalSha256'],
        'runtimeVersions': [runtime['dataset']['version']],
        'runtimeCardDigests': {c['id']: runtime_card_digest(c) for c in runtime['cards']},
        'canonicalGameplayDigests': {c['sourceCard']['sourceId']: hashlib.sha256(json.dumps(gameplay(c),sort_keys=True,ensure_ascii=False).encode()).hexdigest() for c in canonical['cards']},
        'characters': {r['sourceId']:r['fields'] for r in canonical['sourceRecords'] if r['table']=='Character'},
        'inheritedCompatibleSelections': runtime['dataset'].get('compatibleSelections', []),
    }
    if allow_active_leading_space:
        result.update(permittedSourceChanges=['active-description-leading-ascii-space'],
                      activeTextDigests={c['id']:active_text_digest(c) for c in runtime['cards']},
                      canonicalActiveTextDigests={c['sourceCard']['sourceId']:active_text_digest(gameplay(c)) for c in canonical['cards']})
    return result


def compare_previous(old_canonical, new_canonical, old_runtime, new_runtime, allow_active_leading_space=False):
    """Fail closed on every old source row or card change except the named policy."""
    encoded = lambda value: json.dumps(value,sort_keys=True,ensure_ascii=False,separators=(',',':'))
    index = {(r['table'],r['sourceId']):r for r in new_canonical['sourceRecords']}
    if len(index) != len(new_canonical['sourceRecords']):
        raise ValueError('Duplicate generated source record')
    allowed, unexpected, missing = [], [], []
    for row in old_canonical['sourceRecords']:
        key=(row['table'],row['sourceId']);other=index.get(key)
        if other is None:
            missing.append(list(key));continue
        fields_equal = encoded(row['fields']) == encoded(other['fields'])
        wrappers_equal = encoded(row['sourceWrapper']) == encoded(other['sourceWrapper'])
        if fields_equal and wrappers_equal: continue
        before,after=row['fields'],other['fields']
        keys=sorted(k for k in before.keys()|after.keys() if (k in before)!=(k in after) or encoded(before.get(k))!=encoded(after.get(k)))
        def strip_wrapper(wrapper):
            return {k:(v.lstrip(' ') if k=='text' and isinstance(v,str) else v) for k,v in wrapper.items()}
        wrappers_text_equal = encoded(strip_wrapper(row['sourceWrapper'])) == encoded(strip_wrapper(other['sourceWrapper']))
        permitted=(allow_active_leading_space and row['table']=='LangGeneratedLiveActiveSkillLevel_Jpn'
                   and wrappers_text_equal and keys==['text'] and isinstance(before.get('text'),str)
                   and before['text'].startswith(' ') and after.get('text')==before['text'].lstrip(' '))
        if permitted: allowed.append({'table':key[0],'sourceId':key[1]})
        else: unexpected.append({'table':key[0],'sourceId':key[1],'fields':keys,'wrapperChanged':not wrappers_equal})
    old_cards={c['sourceCard']['sourceId']:c for c in old_canonical['cards']}
    new_cards={c['sourceCard']['sourceId']:c for c in new_canonical['cards']}
    old_rt={c['id']:c for c in old_runtime['cards']};new_rt={c['id']:c for c in new_runtime['cards']}
    canonical_changed=[];runtime_changed=[]
    for key,card in old_cards.items():
        if key not in new_cards:continue
        a,b=card,new_cards[key]
        if encoded(a)!=encoded(b) and not (allow_active_leading_space and active_text_digest(a)==active_text_digest(b)):
            canonical_changed.append(key)
        if key not in new_rt or (runtime_card_digest(old_rt[key])!=runtime_card_digest(new_rt[key]) and not
                (allow_active_leading_space and active_text_digest(old_rt[key])==active_text_digest(new_rt[key]))):
            runtime_changed.append(key)
    removed=sorted(old_cards.keys()-new_cards.keys())
    return {'beforeCount':len(old_cards),'afterCount':len(new_cards),
            'addedCardIds':sorted(new_cards.keys()-old_cards.keys()),'removedCardIds':removed,
            'approvedActiveTextRows':allowed,'missingOldSourceRows':missing,'unexpectedSourceChanges':unexpected,
            'unexpectedCanonicalCardIds':canonical_changed,'unexpectedRuntimeCardIds':runtime_changed,
            'passed':not (removed or missing or unexpected or canonical_changed or runtime_changed)}
