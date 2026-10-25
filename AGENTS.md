# Project architecture
- Apply theme through one shared root-class helper and global semantic CSS tokens so initial load and settings use the same palette.
- Keep Premium entitlements in server-maintained membership records with no client write grants; enforce seed and reply access with RLS, never browser preferences.
- Keep plant draft data in navigation state when opening location analysis so unsaved photos and fields survive the return.
- Use a shared grouped plant-type picker and category-specific lifecycle definitions for plant entry.
- Link new plants to owner-scoped categorized locations; reuse matching locations instead of creating duplicates.