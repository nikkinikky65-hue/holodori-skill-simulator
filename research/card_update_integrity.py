"""Semantic digest ignores only Canonical pointer locations, not game values."""
import hashlib,json

def runtime_card_digest(card):
    def clean(x):
        if isinstance(x,list):return [clean(v) for v in x]
        if isinstance(x,dict):return {k:clean(v) for k,v in x.items() if k!='source'}
        return x
    return hashlib.sha256(json.dumps(clean(card),sort_keys=True,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
