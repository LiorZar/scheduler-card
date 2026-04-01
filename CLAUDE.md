# scheduler-card-ui — Scheduler Lovelace Card

Third-party Lovelace card by @nielsfaber (v3.2.15) for the `scheduler` component.
Provides UI for creating, editing, and managing scheduled automations.
**Do not modify** unless explicitly asked.

## Repo & Build

- **Own git repo** — not tracked by the config repo (gitignored)
- **Build tool**: Rollup (IIFE bundle)
- **Output**: `dist/scheduler-card.js` — hardlinked to `config/www/scheduler-card/`
- **Framework**: Lit 2.x (web components with decorators)

```bash
# Build
npm run build

# Watch mode
npm start
```

## Component Hierarchy

```
scheduler-card (main Lovelace card)
  ├── Schedule list with enable/disable toggles
  ├── my-relative-time (dynamic countdown)
  └── Opens → scheduler-editor-dialog
                ├── scheduler-editor-entity   # Tab 1: entity + action selection
                ├── scheduler-editor-time     # Tab 2: timeslots (periodic/timeline)
                └── scheduler-editor-options  # Tab 3: tags, repeat mode, date range

scheduler-card-editor (card configuration)
  ├── Tab: Entities (domain/entity include/exclude)
  └── Tab: Other (title, time_step, sort_by, display_format, tags)
```

## Custom Element Names

- `scheduler-card` — main card (registered with HA `customCards`)
- `scheduler-card-editor` — card config editor
- `scheduler-editor-dialog` — create/edit schedule dialog

## Source Layout

| Directory | Purpose |
|-----------|---------|
| `src/` | Entry point (`scheduler-card.ts`), editor, types, constants, styles |
| `src/components/` | Reusable Lit components (time-picker, button-group, variable-slider, etc.) |
| `src/data/` | Data layer: WebSocket calls, action computation, time formatting, entity filtering |
| `src/editor/` | Schedule editor dialog and its 3 tab panels |
| `src/localize/` | i18n with 22 language JSON files |
| `src/standard-configuration/` | Predefined actions, states, icons per entity domain |

## Backend Communication

| Direction | Method | Details |
|-----------|--------|---------|
| Fetch schedules | `hass.callWS({ type: 'scheduler' })` | Returns Schedule[] |
| Fetch tags | `hass.callWS({ type: 'scheduler/tags' })` | Returns TagEntry[] |
| Subscribe | `hass.callWS({ type: 'scheduler_updated' })` | Real-time schedule events |
| Create | `POST /api/scheduler/add` | ScheduleConfig body |
| Update | `POST /api/scheduler/edit` | ScheduleConfig + schedule_id |
| Delete | `POST /api/scheduler/remove` | { schedule_id } |

## ConX Integration

The card fetches ConX data for populating action options:
- SK (softkeys): `conx.cmd` → `db.Get('sk')`
- Cues: `conx.cmd` → `db.Get('cues')`
- Radio: `conx.cmd` → `db.Get('radio')`

## Dependencies

**Runtime**: Lit 2.x, custom-card-helpers, home-assistant-js-websocket, @mdi/js, fecha
**Build**: Rollup, rollup-plugin-typescript2, terser, node-resolve, commonjs
