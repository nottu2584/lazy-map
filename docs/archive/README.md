# Documentation Archive

This directory contains archived documentation that has been superseded or significantly revised.

## Purpose

Documents are archived rather than deleted to:
- Preserve design history and rationale
- Provide reference for future enhancements
- Document what was considered but deferred
- Maintain institutional knowledge

## Archived Documents

### building-damage-system.md
- **Archived**: November 5, 2025
- **Superseded by**: `/docs/features/planned/building-condition-tactical-system.md`
- **Reason**: Original proposed a comprehensive damage tracking system. The planned feature implements a simplified tactical integration first (Phase 1-4), deferring advanced features (Phase 5+).
- **Contains**: Design for DamageType enum, BuildingCondition class, visual sprite variations, dynamic degradation systems
- **Use case**: Reference for future implementation of advanced damage tracking features

## When to Archive

Archive a document when:
1. ✅ It's been superseded by a newer planned/current feature
2. ✅ Core concepts have been implemented differently
3. ✅ Contains valuable design ideas deferred to future phases
4. ✅ Should be preserved for historical/reference purposes

Do NOT archive:
- ❌ Documents that are still actively being worked on
- ❌ Current or planned features
- ❌ Documentation that is still accurate

## Archive Process

1. Add header to document indicating archive status:
   ```markdown
   # Document Title (ARCHIVED)
   
   > **Status**: Archived - Superseded by [link]
   > **Archived Date**: [date]
   > **Reason**: [brief explanation]
   ```

2. Add coverage analysis showing what was implemented vs deferred

3. Update references in active documents to point to archive

4. Move document from original location to `/docs/archive/`

5. Update this README with entry

## Restoration

Archived documents can be restored if:
- Design decisions are revisited
- Deferred features become priorities
- New context makes original approach viable

To restore: Move back to original location and remove archive header.
