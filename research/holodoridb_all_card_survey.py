#!/usr/bin/env python3
"""Build a provenance-preserving, joined survey of HolodoriDB card records.

This is an offline research utility. It reads one immutable public commit and
writes only reachable, transformed table rows plus join/provenance metadata;
it does not connect to the simulator or change upstream data.
"""
from __future__ import annotations

import argparse
import collections
import datetime as dt
import json
import urllib.error
import urllib.request
from pathlib import Path

REPOSITORY = "https://github.com/HolodoriDB/holodori-db-jpn-diff"
COMMIT = "e43f062c32ff4e04567235efcd58448cd6b10f35"
RAW_BASE = f"https://raw.githubusercontent.com/HolodoriDB/holodori-db-jpn-diff/{COMMIT}/"
TABLES = [
    "Card", "CardLevel", "CardLevelLimit", "CardPotential", "CardPotentialUpgradeItem",
    "LangCard_Jpn", "LangCharacter_Jpn", "LangCharacterProduction_Jpn",
    "Character", "CharacterProduction", "CharacterGrouping",
    "LivePassiveSkill", "LivePassiveSkillLevel", "LivePassiveSkillEffect",
    "LiveActiveSkill", "LiveActiveSkillLevel", "LiveActiveSkillEffect",
    "LiveSpecialSkill", "LiveSpecialSkillLevel", "LiveSkillEffectTarget", "LiveSkillTrigger",
    "SkillTreeConnectEffect", "SkillTreeConnectEffectExtent",
    "LangGeneratedLivePassiveSkillLevel_Jpn", "LangGeneratedLivePassiveSkillEffect_Jpn",
    "LangGeneratedLiveActiveSkillLevel_Jpn", "LangGeneratedLiveActiveSkillEffect_Jpn",
    "LangGeneratedLiveSpecialSkillLevel_Jpn", "LangGeneratedLiveSkillEffectTarget_Jpn",
    "LangGeneratedLiveSkillTrigger_Jpn", "LangGeneratedSkillTreeConnectEffect_Jpn",
    "LangCharacterGrouping_Jpn",
]
SKILLS = {
    "passive": {
        "cardField": "livePassiveSkillId", "master": "LivePassiveSkill",
        "level": "LivePassiveSkillLevel", "levelField": "livePassiveSkillId",
        "groupField": "livePassiveSkillEffectGroupId", "effect": "LivePassiveSkillEffect",
        "extraEffectFields": [], "triggerFields": ["liveSkillTriggerGroupId"],
        "levelLang": "LangGeneratedLivePassiveSkillLevel_Jpn",
    },
    "active": {
        "cardField": "liveActiveSkillId", "master": "LiveActiveSkill",
        "level": "LiveActiveSkillLevel", "levelField": "liveActiveSkillId",
        "groupField": "liveActiveSkillEffectGroupId", "effect": "LiveActiveSkillEffect",
        "extraEffectFields": ["additionalLiveActiveSkillEffectGroupId"],
        "triggerFields": ["additionalLiveSkillTriggerGroupId"],
        "levelLang": "LangGeneratedLiveActiveSkillLevel_Jpn",
    },
    "special": {
        "cardField": "liveSpecialSkillId", "master": "LiveSpecialSkill",
        "level": "LiveSpecialSkillLevel", "levelField": "liveSpecialSkillId",
        "groupField": "liveActiveSkillEffectGroupId", "effect": "LiveActiveSkillEffect",
        "extraEffectFields": ["additionalLiveActiveSkillEffectGroupId"],
        "triggerFields": ["additionalLiveSkillTriggerGroupId"],
        "levelLang": "LangGeneratedLiveSpecialSkillLevel_Jpn",
    },
}
LANG_TABLES = [name for name in TABLES if name.startswith("Lang")]


def fetch_table(name: str):
    request = urllib.request.Request(RAW_BASE + name + ".json", headers={"User-Agent": "holodori-card-research-poc"})
    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        if error.code == 404:
            return None
        raise


def row_data(row):
    return row.get("data", row)


def wrapper_fields(row):
    return {key: value for key, value in row.items() if key != "data"}


def source_row_id(table, row):
    fields = row_data(row)
    wrapper = wrapper_fields(row)
    if fields.get("id") is not None:
        return str(fields["id"])
    if wrapper:
        return ";".join(f"{key}={wrapper[key]}" for key in sorted(wrapper))
    keys = [key for key in ("groupId", "level", "number", "upgradeCount", "limitBreakCount") if key in fields]
    return ";".join(f"{key}={fields[key]}" for key in keys) or json.dumps(fields, sort_keys=True, ensure_ascii=False)


def json_safe_counter(counter):
    return [{"key": key, "count": count} for key, count in sorted(counter.items(), key=lambda item: str(item[0]))]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", default="research/holodoridb-all-card-survey.json", help="output JSON path")
    args = parser.parse_args()

    tables = {name: fetch_table(name) for name in TABLES}
    tables = {name: rows for name, rows in tables.items() if rows is not None}
    indexed = {name: [row_data(row) for row in rows] for name, rows in tables.items()}
    wrappers = {name: rows for name, rows in tables.items()}
    by_id = {name: {row.get("id"): row for row in rows if row.get("id") is not None} for name, rows in indexed.items()}
    by_group = {}
    for name, rows in wrappers.items():
        group_map = collections.defaultdict(list)
        for row in rows:
            group_id = row.get("group_id", row_data(row).get("groupId"))
            if group_id is not None:
                group_map[group_id].append(row)
        by_group[name] = group_map

    cards = indexed["Card"]
    card_names = by_id.get("LangCard_Jpn", {})
    card_count = len(cards)
    selected = collections.defaultdict(dict)
    missing_joins = []

    def add(table, row):
        if row is None:
            return None
        record_id = source_row_id(table, row)
        selected[table][record_id] = {
            "sourceId": record_id,
            "sourceWrapper": wrapper_fields(row),
            "fields": row_data(row),
        }
        return record_id

    def find_group(table, group_id):
        if group_id is None:
            return []
        return by_group.get(table, {}).get(group_id, [])

    def join_one(card, table, key, value, records):
        row = by_id.get(table, {}).get(value)
        if row is None:
            missing_joins.append({"cardId": card.get("id"), "table": table, "joinField": key, "joinValue": value})
            return None
        records.append(add(table, row))
        return row

    # Complete Card rows and their direct dimension/localization references.
    per_card_refs = {}
    for card in cards:
        cid = card.get("id")
        add("Card", by_id["Card"][cid])
        refs = {"cardId": cid, "joined": {}}
        join_one(card, "LangCard_Jpn", "nameLangId", card.get("nameLangId"), refs["joined"].setdefault("name", []))
        character = join_one(card, "Character", "characterId", card.get("characterId"), refs["joined"].setdefault("character", []))
        if character:
            production_id = row_data(character).get("characterProductionId")
            if production_id:
                join_one(card, "CharacterProduction", "id", production_id, refs["joined"].setdefault("production", []))
        for card_field, table, group_field, label in [
            ("cardLevelGroupId", "CardLevel", "group_id", "cardLevels"),
            ("cardLevelLimitGroupId", "CardLevelLimit", "group_id", "levelLimits"),
            ("cardPotentialGroupId", "CardPotential", "group_id", "potential"),
        ]:
            value = card.get(card_field)
            matched = find_group(table, value)
            refs["joined"][label] = [add(table, row) for row in matched]
            if not matched:
                missing_joins.append({"cardId": cid, "table": table, "joinField": card_field, "joinValue": value})
        rarity_rows = [row for row in wrappers.get("CardPotentialUpgradeItem", []) if row_data(row).get("rarity") == card.get("rarity")]
        refs["joined"]["potentialUpgradeItem"] = [add("CardPotentialUpgradeItem", row) for row in rarity_rows]
        for skill_name, spec in SKILLS.items():
            skill_id = card.get(spec["cardField"])
            master = join_one(card, spec["master"], "id", skill_id, refs["joined"].setdefault(skill_name, []))
            level_rows = [row for row in indexed[spec["level"]] if row.get(spec["levelField"]) == skill_id]
            refs["joined"][skill_name + "Levels"] = []
            if not level_rows:
                missing_joins.append({"cardId": cid, "table": spec["level"], "joinField": spec["levelField"], "joinValue": skill_id})
            for level in level_rows:
                # Recover its original wrapped row; level tables use a compound wrapper key.
                wrapped = next(row for row in wrappers[spec["level"]] if row_data(row) is level)
                refs["joined"][skill_name + "Levels"].append(add(spec["level"], wrapped))
                effect_groups = [level.get(spec["groupField"])] + [level.get(field) for field in spec["extraEffectFields"]]
                for group_id in effect_groups:
                    if not group_id:
                        continue
                    effect_rows = find_group(spec["effect"], group_id)
                    if not effect_rows:
                        missing_joins.append({"cardId": cid, "table": spec["effect"], "joinField": "group_id", "joinValue": group_id})
                    for effect_row in effect_rows:
                        add(spec["effect"], effect_row)
                        target_id = row_data(effect_row).get("liveSkillEffectTargetId")
                        if target_id:
                            join_one(card, "LiveSkillEffectTarget", "id", target_id, refs["joined"].setdefault("targets", []))
                for trigger_field in spec["triggerFields"]:
                    trigger_group = level.get(trigger_field)
                    if trigger_group:
                        trigger_rows = find_group("LiveSkillTrigger", trigger_group)
                        if not trigger_rows:
                            missing_joins.append({"cardId": cid, "table": "LiveSkillTrigger", "joinField": "group_id", "joinValue": trigger_group})
                        for trigger_row in trigger_rows:
                            add("LiveSkillTrigger", trigger_row)
            per_card_refs[cid] = refs if skill_name == "special" else per_card_refs.get(cid, refs)
        # Preserve complete direct source references in a per-card join index.
        per_card_refs[cid] = refs
        connect_id = card.get("skillTreeConnectEffectId")
        if connect_id:
            connect_rows = [row for row in indexed.get("SkillTreeConnectEffect", []) if row.get("id") == connect_id]
            refs["joined"]["connectEffect"] = [add("SkillTreeConnectEffect", row) for row in connect_rows]
            if not connect_rows:
                missing_joins.append({"cardId": cid, "table": "SkillTreeConnectEffect", "joinField": "id", "joinValue": connect_id})
            for row in connect_rows:
                extent_id = row.get("skillTreeConnectEffectExtentGroupId")
                refs["joined"]["connectExtent"] = [add("SkillTreeConnectEffectExtent", ext) for ext in find_group("SkillTreeConnectEffectExtent", extent_id)]

    # Trigger/target character-grouping dimensions and linked Japanese generated strings.
    grouping_ids = set()
    for table in ("LiveSkillEffectTarget", "LiveSkillTrigger"):
        for record in selected.get(table, {}).values():
            grouping_id = record["fields"].get("characterGroupingId")
            if grouping_id:
                grouping_ids.add(grouping_id)
    for grouping_id in sorted(grouping_ids):
        if grouping_id in by_id.get("CharacterGrouping", {}):
            add("CharacterGrouping", by_id["CharacterGrouping"][grouping_id])
        else:
            missing_joins.append({"cardId": None, "table": "CharacterGrouping", "joinField": "id", "joinValue": grouping_id})

    # Attach all Japanese localization rows referenced by selected source rows; keep their source IDs.
    language_indexes = {table: by_id.get(table, {}) for table in LANG_TABLES}
    for table, records in list(selected.items()):
        for record in list(records.values()):
            fields = record["fields"]
            lang_ids = set()
            for key, value in fields.items():
                if key.endswith("LangId") and isinstance(value, str):
                    lang_ids.add(value)
                elif key.endswith("LangIds") and isinstance(value, list):
                    lang_ids.update(item for item in value if isinstance(item, str))
            for lang_id in lang_ids:
                for lang_table, lang_index in language_indexes.items():
                    if lang_id in lang_index:
                        add(lang_table, lang_index[lang_id])
                        break

    # Structural summaries count per-card level references, not only unique shared source rows.
    summary = {
        "cardCount": card_count,
        "cardRarityCounts": dict(collections.Counter(card.get("rarity") for card in cards)),
        "cardLocalizedNameCoverage": sum(card.get("nameLangId") in card_names for card in cards),
        "uniqueCardIds": len({card.get("id") for card in cards}),
        "cardOptionalFieldCounts": {
            key: sum(key in card for card in cards)
            for key in sorted(set().union(*(card.keys() for card in cards)))
            if sum(key in card for card in cards) != card_count
        },
        "skillStructures": {},
        "levelStructures": {},
        "potentialStructures": {},
        "targetTypes": {},
        "targetOccurrenceTypes": {},
        "triggerTypes": {},
        "unreferencedFetchedRows": {},
        "sourceRowsFetched": {name: len(rows) for name, rows in tables.items()},
        "joinedRowsStored": {name: len(rows) for name, rows in selected.items()},
        "unresolvedJoinCount": len(missing_joins),
    }
    card_map = {card.get("id"): card for card in cards}
    target_by_id = by_id.get("LiveSkillEffectTarget", {})
    target_type_counts = collections.Counter()
    trigger_type_counts = collections.Counter()
    for record in selected.get("LiveSkillEffectTarget", {}).values():
        target_type_counts[record["fields"].get("type", "<absent>")] += 1
    for record in selected.get("LiveSkillTrigger", {}).values():
        trigger_type_counts[record["fields"].get("type", "<absent>")] += 1
    summary["targetTypes"] = dict(target_type_counts)
    summary["triggerTypes"] = dict(trigger_type_counts)
    target_occurrences = collections.Counter()
    target_field_shapes = collections.Counter()
    trigger_field_shapes_all = collections.Counter()
    for record in selected.get("LiveSkillEffectTarget", {}).values():
        target_field_shapes[tuple(sorted(key for key in record["fields"] if key not in ("id", "descriptionLangId")))] += 1
    for record in selected.get("LiveSkillTrigger", {}).values():
        trigger_field_shapes_all[tuple(sorted(key for key in record["fields"] if key not in ("groupId", "number", "descriptionLangId")))] += 1
    passive_levels_by_skill = collections.defaultdict(list)
    for level in indexed["LivePassiveSkillLevel"]:
        passive_levels_by_skill[level.get("livePassiveSkillId")].append(level)
    for card in cards:
        for level in passive_levels_by_skill.get(card.get("livePassiveSkillId"), []):
            for effect_wrapper in find_group("LivePassiveSkillEffect", level.get("livePassiveSkillEffectGroupId")):
                target_id = row_data(effect_wrapper).get("liveSkillEffectTargetId")
                target = target_by_id.get(target_id)
                if target:
                    target_occurrences[row_data(target).get("type", "<absent>")] += 1
    summary["targetOccurrenceTypes"] = dict(target_occurrences)
    summary["targetFieldShapes"] = [
        {"fields": list(fields), "uniqueTargetRows": count}
        for fields, count in sorted(target_field_shapes.items(), key=lambda item: str(item[0]))
    ]
    summary["triggerFieldShapes"] = [
        {"fields": list(fields), "uniqueTriggerRows": count}
        for fields, count in sorted(trigger_field_shapes_all.items(), key=lambda item: str(item[0]))
    ]
    summary["unreferencedFetchedRows"] = {
        table: len(rows) - len(selected.get(table, {}))
        for table, rows in tables.items()
        if len(rows) > len(selected.get(table, {}))
    }
    shape_tables = [
        "Card", "CardLevel", "CardLevelLimit", "CardPotential", "LivePassiveSkillLevel",
        "LivePassiveSkillEffect", "LiveActiveSkillLevel", "LiveActiveSkillEffect",
        "LiveSpecialSkillLevel", "LiveSkillEffectTarget", "LiveSkillTrigger",
    ]
    summary["sourceFieldShapes"] = {
        table: [
            {"fields": list(fields), "uniqueRows": count}
            for fields, count in sorted(
                collections.Counter(
                    tuple(sorted(record["fields"].keys()))
                    for record in selected.get(table, {}).values()
                ).items(),
                key=lambda item: str(item[0]),
            )
        ]
        for table in shape_tables
    }

    for skill_name, spec in SKILLS.items():
        skill_rows = indexed[spec["level"]]
        by_skill = collections.defaultdict(list)
        for row in skill_rows:
            by_skill[row.get(spec["levelField"])].append(row)
        level_patterns = collections.Counter()
        row_patterns = collections.Counter()
        effect_types = collections.Counter()
        primary_types = collections.Counter()
        additional_types = collections.Counter()
        trigger_references = collections.Counter()
        trigger_type_occurrences = collections.Counter()
        trigger_field_shapes = collections.Counter()
        level_field_shapes = collections.Counter()
        primary_effect_count_distribution = collections.Counter()
        additional_effect_count_distribution = collections.Counter()
        effect_type_examples = collections.defaultdict(list)
        card_trigger_count = 0
        for card in cards:
            skill_id = card.get(spec["cardField"])
            levels = by_skill.get(skill_id, [])
            level_patterns[tuple(sorted(row.get("level") for row in levels))] += 1
            has_trigger = False
            for level in levels:
                level_field_shapes[tuple(sorted(level.keys()))] += 1
                primary_rows = find_group(spec["effect"], level.get(spec["groupField"]))
                additional_rows = [effect for field in spec["extraEffectFields"] if level.get(field) for effect in find_group(spec["effect"], level[field])]
                for effect in primary_rows:
                    effect_data = row_data(effect)
                    kind = effect_data.get("type", "<absent>")
                    primary_types[kind] += 1
                    effect_types[kind] += 1
                    if len(effect_type_examples[kind]) < 5:
                        effect_type_examples[kind].append({"cardId": card.get("id"), "skillId": skill_id, "level": level.get("level"), "groupId": effect_data.get("groupId")})
                for effect in additional_rows:
                    effect_data = row_data(effect)
                    kind = effect_data.get("type", "<absent>")
                    additional_types[kind] += 1
                    effect_types[kind] += 1
                    if len(effect_type_examples[kind]) < 5:
                        effect_type_examples[kind].append({"cardId": card.get("id"), "skillId": skill_id, "level": level.get("level"), "groupId": effect_data.get("groupId")})
                primary_effect_count_distribution[len(primary_rows)] += 1
                additional_effect_count_distribution[len(additional_rows)] += 1
                trigger_values = [level.get(field) for field in spec["triggerFields"] if level.get(field)]
                if trigger_values:
                    has_trigger = True
                present_additional = any(level.get(field) for field in spec["extraEffectFields"])
                row_patterns[(bool(trigger_values), present_additional)] += 1
                for value in trigger_values:
                    trigger_references[value] += 1
                    trigger_rows = find_group("LiveSkillTrigger", value)
                    for trigger_row in trigger_rows:
                        trigger_data = row_data(trigger_row)
                        trigger_type_occurrences[trigger_data.get("type", "<absent>")] += 1
                        trigger_field_shapes[tuple(sorted(key for key in trigger_data if key not in ("groupId", "number", "descriptionLangId")))] += 1
            card_trigger_count += int(has_trigger)
        summary["skillStructures"][skill_name] = {
            "levelPatternCounts": [{"levels": list(levels), "cards": count} for levels, count in sorted(level_patterns.items(), key=lambda item: str(item[0]))],
            "levelRowPatternCounts": [
                {"hasTriggerReference": trigger, "hasAdditionalEffectGroup": additional, "levelRows": count}
                for (trigger, additional), count in sorted(row_patterns.items())
            ],
            "levelFieldShapes": [
                {"fields": list(fields), "levelRows": count}
                for fields, count in sorted(level_field_shapes.items(), key=lambda item: str(item[0]))
            ],
            "primaryEffectTypeCounts": dict(primary_types),
            "additionalEffectTypeCounts": dict(additional_types),
            "allEffectTypeCounts": dict(effect_types),
            "primaryEffectCountPerLevelRow": dict(primary_effect_count_distribution),
            "additionalEffectCountPerLevelRow": dict(additional_effect_count_distribution),
            "cardsWithTriggerReference": card_trigger_count,
            "triggerGroupReferenceCounts": dict(trigger_references),
            "triggerTypeOccurrenceCounts": dict(trigger_type_occurrences),
            "triggerFieldShapes": [{"fields": list(fields), "occurrences": count} for fields, count in sorted(trigger_field_shapes.items(), key=lambda item: str(item[0]))],
            "effectTypeExamples": dict(effect_type_examples),
        }

    card_level_groups = collections.defaultdict(list)
    for row in indexed["CardLevel"]:
        card_level_groups[row.get("groupId")].append(row)
    level_profile_counts = collections.Counter()
    for card in cards:
        rows = card_level_groups.get(card.get("cardLevelGroupId"), [])
        if rows:
            levels = [row["level"] for row in rows]
            level_profile_counts[(len(rows), min(levels), max(levels))] += 1
    limit_groups = collections.defaultdict(list)
    for row in wrappers["CardLevelLimit"]:
        limit_groups[row.get("group_id")].append(row)
    limit_profile_counts = collections.Counter()
    for card in cards:
        rows = sorted(limit_groups.get(card.get("cardLevelLimitGroupId"), []), key=lambda row: row.get("limit_break_count", -1))
        signature = tuple((row.get("limit_break_count"), row_data(row).get("levelLimit")) for row in rows)
        limit_profile_counts[signature] += 1
    summary["levelStructures"] = {
        "groupCountReferenced": len({card.get("cardLevelGroupId") for card in cards}),
        "uniqueJoinedLevelRows": len(selected.get("CardLevel", {})),
        "cardLevelRowAssociationsAcrossCards": sum(len(find_group("CardLevel", card.get("cardLevelGroupId"))) for card in cards),
        "profiles": [{"rowCount": count, "minLevel": low, "maxLevel": high, "cards": amount} for (count, low, high), amount in sorted(level_profile_counts.items())],
        "levelLimitProfiles": [
            {"cards": amount, "limits": [{"limitBreakCount": count, "levelLimit": cap} for count, cap in signature]}
            for signature, amount in sorted(limit_profile_counts.items(), key=lambda item: str(item[0]))
        ],
    }
    potential_groups = collections.defaultdict(list)
    for row in indexed["CardPotential"]:
        potential_groups[row.get("groupId")].append(row)
    potential_profiles = collections.Counter()
    for card in cards:
        rows = sorted(potential_groups.get(card.get("cardPotentialGroupId"), []), key=lambda row: row.get("upgradeCount", 0))
        signature = tuple((row.get("upgradeCount"), row.get("effectType"), row.get("value")) for row in rows)
        potential_profiles[signature] += 1
    summary["potentialStructures"] = [
        {"cards": amount, "upgradeSteps": [{"upgradeCount": count, "effectType": kind, "value": value} for count, kind, value in signature]}
        for signature, amount in sorted(potential_profiles.items(), key=lambda item: str(item[0]))
    ]

    # Human-readable exception index: counts plus source-linked examples, without deciding undocumented meanings.
    exceptions = []
    def add_exception(code, count, source_table, examples, note):
        exceptions.append({"code": code, "occurrences": count, "sourceTable": source_table, "examples": examples[:8], "note": note})

    optional = summary["cardOptionalFieldCounts"]
    for field, count in optional.items():
        add_exception("Card.optionalField." + field, card_count - count, "Card", [card["id"] for card in cards if field not in card], "Field is absent from some Card rows; absence is preserved, not filled with a default.")
    for skill_name, spec in SKILLS.items():
        skill_rows = indexed[spec["level"]]
        level_index = collections.defaultdict(list)
        for row in skill_rows:
            level_index[row.get(spec["levelField"])].append(row)
        trigger_field = spec["triggerFields"][0] if spec["triggerFields"] else None
        add_effect_field = spec["extraEffectFields"][0] if spec["extraEffectFields"] else None
        if trigger_field:
            hits = [card for card in cards if any(row.get(trigger_field) for row in level_index.get(card.get(spec["cardField"]), []))]
            add_exception(skill_name + ".hasTriggerReference", len(hits), spec["level"], [card["id"] for card in hits], "Some level rows reference LiveSkillTrigger; do not infer a shared condition where no reference exists.")
        if add_effect_field:
            hits = [card for card in cards if any(row.get(add_effect_field) for row in level_index.get(card.get(spec["cardField"]), []))]
            add_exception(skill_name + ".hasAdditionalEffectGroup", len(hits), spec["level"], [card["id"] for card in hits], "Additional effect groups are separate references and must not be dropped or merged into primary effect values.")

    record = {
        "format": "holodoridb-all-card-joined-research-v1",
        "canonicalSimulatorSchema": "not-defined; no simulator conversion performed",
        "provenance": {
            "repository": REPOSITORY,
            "commitSha": COMMIT,
            "commitUrl": f"{REPOSITORY}/tree/{COMMIT}",
            "retrievedAtUtc": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
            "publicScope": {
                "selection": "All records in the pinned Card table; 185 unique IDs and 185/185 Japanese name lookups resolved.",
                "independentPublishedCatalogCheck": "The public Holodori card-list page reported 185 listed cards on 2026-09-29, matching the source Card table cardinality. This is a count-level cross-check, not a separate ID-by-ID web verification.",
                "url": "https://www.horodori.com/cards",
            },
            "originalFilesCopied": False,
        },
        "method": {
            "description": "Rows reachable from each Card through declared foreign-ID/group references are deduplicated by source table and source row key. Each output row separates source table, source wrapper/join keys, and original data fields; unrelated table rows are omitted.",
            "sourceFields": "Values in fields are preserved as received (including enum strings, numeric strings, nested values and localized template tags); no semantic conversion or simulator schema mapping is performed.",
            "missingJoinPolicy": "Missing references are listed in joinExceptions; missing values are not fabricated.",
            "joins": [
                "Card.nameLangId -> LangCard_Jpn.id; Card.characterId -> Character.id -> Character.characterProductionId -> CharacterProduction.id; referenced Character/CharacterProduction/CharacterGrouping LangIds -> matching Japanese localization table ids",
                "Card.cardLevelGroupId -> CardLevel.group_id; Card.cardLevelLimitGroupId -> CardLevelLimit.group_id",
                "Card.cardPotentialGroupId -> CardPotential.group_id; Card.rarity -> CardPotentialUpgradeItem.rarity",
                "Card.live{Passive,Active,Special}SkillId -> respective skill master.id and level.{skillId}; level effect group IDs -> effect.group_id",
                "Effect.liveSkillEffectTargetId -> LiveSkillEffectTarget.id; skill-level trigger group IDs -> LiveSkillTrigger.group_id",
                "Card.skillTreeConnectEffectId -> SkillTreeConnectEffect.id -> SkillTreeConnectEffectExtent.group_id",
                "Referenced *LangId fields -> matching Japanese language table id; target/trigger characterGroupingId -> CharacterGrouping.id",
            ],
            "limitations": ["External public listing count is matched but individual source card IDs were not separately web-verified.", "Undocumented enum/value meanings remain raw and unresolved.", "No source JSON file is copied verbatim and no simulator, Library, or Event code is changed."],
        },
        "coverage": summary,
        "metricDefinitions": {
            "sourceRowsFetched": "Rows present in each complete pinned source table; some can be unrelated to Card records.",
            "joinedRowsStored": "Unique reachable source rows serialized once per table, deduplicated by source row key.",
            "unreferencedFetchedRows": "Fetched table rows not reachable by the declared Card-rooted joins; not serialized and not classified as unpublished.",
            "cardLevelRowAssociationsAcrossCards": "Sum of CardLevel rows per card, so shared level groups count once for each referencing card.",
            "skillStructures.*Counts": "Level-row/effect-row occurrences across card skill references, rather than unique source effect groups unless explicitly stated.",
            "targetTypes/triggerTypes": "Unique reachable source target/trigger rows by raw type enum; skill-specific occurrence counts are also reported under skillStructures.",
            "targetOccurrenceTypes": "Passive effect references grouped by the raw type of their linked target row; each per-card skill-level effect reference counts once.",
        },
        "exceptions": exceptions,
        "joinExceptions": missing_joins,
        "cardIndex": [
            {
                "sourceId": card.get("id"),
                "nameJa": (card_names.get(card.get("nameLangId")) or {}).get("text"),
                "rarityRaw": card.get("rarity"),
                "attributeRaw": card.get("attributeType"),
                "sourceRefs": {key: card.get(key) for key in ["characterId", "nameLangId", "cardLevelGroupId", "cardLevelLimitGroupId", "cardPotentialGroupId", "livePassiveSkillId", "liveActiveSkillId", "liveSpecialSkillId", "skillTreeConnectEffectId"] if key in card},
            }
            for card in sorted(cards, key=lambda item: item.get("id", ""))
        ],
        "joinedSourceRows": {
            table: sorted(records.values(), key=lambda item: item["sourceId"])
            for table, records in sorted(selected.items())
        },
    }
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(output), "cardCount": card_count, "unresolvedJoinCount": len(missing_joins), "joinedRowCounts": summary["joinedRowsStored"], "bytes": output.stat().st_size}, ensure_ascii=False))


if __name__ == "__main__":
    main()
