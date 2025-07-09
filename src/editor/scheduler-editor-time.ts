import { LitElement, html, css, PropertyValues } from 'lit';
import { property, customElement, state } from 'lit/decorators.js';
import { HomeAssistant, computeEntity } from 'custom-card-helpers';
import { localize } from '../localize/localize';
import {
    CardConfig,
    EntityElement,
    EMonthType,
    EMonthDaysType,
    EDayType,
    ScheduleConfig,
    Timeslot,
    WeekdayType,
    Action,
    ServiceCall,
    ETimeEvent,
    MonthType,
    MonthDaysType,
} from '../types';
import { PrettyPrintIcon, PrettyPrintName, capitalize, sortAlphabetically, omit, isEqual, getLocale } from '../helpers';
import { DefaultTimeStep, DefaultActionIcon, ETimeTab } from '../const';
import { commonStyle } from '../styles';
import { computeActionDisplay } from '../data/actions/compute_action_display';
import { startOfWeek } from '../data/date-time/start_of_week';
import { monthArray, formatMonth, weekdayArray, formatWeekday } from '../data/date-time/format_weekday';
import { weekdayType, monthType, monthdaysType } from '../data/date-time/weekday_type';
import { compareActions } from '../data/actions/compare_actions';
import { assignAction } from '../data/actions/assign_action';
import { parseRelativeTime, stringToTime, timeToString } from '../data/date-time/time';
import { absToRelTime, relToAbsTime } from '../data/date-time/relative_time';

import '../components/time-picker';
import '../components/timeslot-editor';
import '../components/variable-picker';

@customElement('scheduler-editor-time')
export class SchedulerEditorTime extends LitElement {
    @property()
    hass?: HomeAssistant;

    @property()
    config?: CardConfig;

    @property()
    schedule!: ScheduleConfig;

    @property()
    actions?: Action[];

    @property()
    entities?: EntityElement[];

    @property()
    activeEntry: number | null = null;

    @property()
    activeMarker: number | null = null;

    @property({ type: Boolean })
    timeslots = false;

    @property({ type: Boolean })
    editItem = false;

    @property({ type: Boolean })
    large = false;

    firstUpdated() {
        if (!this.actions || !this.hass) return;
        if (!this.timeslots) this.activeEntry = 0;

        const actions = this.actions.map(e => {
            const action = {
                ...e,
                service_data: omit(e.service_data || {}, ...Object.keys(e.variables || {})),
            };
            return Object.assign(e, {
                name: computeActionDisplay(action),
            });
        });
        actions.sort(sortAlphabetically);
        this.actions = actions;
        this.refreshTimeScheme();
    }

    shouldUpdate(changedProps: PropertyValues): boolean {
        if (changedProps.get('schedule')) {
            this.dispatchEvent(
                new CustomEvent('change', {
                    detail: {
                        schedule: this.schedule,
                    },
                })
            );
        }
        return true;
    }
    @state() private _currTab: ETimeTab = ETimeTab.Scheme;
    _tabs = [ETimeTab.Scheme, ETimeTab.Periodic];

    @state() private _currTimeOp = 'hour';
    @state() private _currEvery = 7;
    @state() private _currStartTime = '00:00:00';

    private _updateStartTime(data: Partial<Timeslot>) {
        this._currStartTime = data.start || '00:00:00';
    }

    private _handleTabChanged(ev: CustomEvent): void {
        const oldTab = this._currTab;
        const newTab = this._tabs[ev.detail.selected] as ETimeTab;
        if (newTab === oldTab) return;
        this._currTab = newTab;
    }
    private _handleTimeOptionChange(ev: CustomEvent): void {
        const checked = (ev.target as HTMLInputElement).checked;
        const value = (ev.target as HTMLInputElement).value;
        if (!checked) return;
        this._currTimeOp = value;
    }
    private _handleEveryChange(ev: CustomEvent): void {
        const value = (ev.target as HTMLInputElement).value;
        this._currEvery = parseInt(value);
    }
    private _applyPeriod(): void {
        const minutes = this._currEvery * ('hour' === this._currTimeOp ? 60 : 1);
        const seconds = minutes * 60;
        const timeslots = this.schedule.timeslots;
        const TS = timeslots.filter(e => e.actions.length)?.[0] || timeslots[0];
        let tot = 0,
            t;

        const time = stringToTime(this._currStartTime, this.hass!);
        if (time > 0) {
            timeslots[tot] = {
                start: timeToString(0),
                stop: this._currStartTime,
                conditions: TS.conditions,
                condition_type: TS.condition_type,
                track_conditions: TS.track_conditions,
                actions: [],
            };
            ++tot;
        }

        for (t = time; t <= 24 * 60 * 60 - seconds; t += seconds) {
            const ts = {
                start: timeToString(t),
                stop: timeToString(t + seconds),
                conditions: TS.conditions,
                condition_type: TS.condition_type,
                track_conditions: TS.track_conditions,
                actions: TS.actions,
            };
            timeslots[tot] = ts;
            ++tot;
        }
        if (t < 24 * 60 * 60) {
            timeslots[tot] = {
                start: timeToString(t),
                stop: timeToString(0),
                conditions: TS.conditions,
                condition_type: TS.condition_type,
                track_conditions: TS.track_conditions,
                actions: [],
            };
            ++tot;
        }
        timeslots.length = tot;
    }
    private refreshTimeScheme(): void {
        const hass = this.hass!;
        const timeslots = this.schedule.timeslots;
        const count = timeslots.length;
        const durations = timeslots.map(
            e => stringToTime(e.stop ? e.stop : '00:00:00', hass!) - stringToTime(e.start, hass!)
        );

        const frequencyMap: { [key: number]: number } = {};
        durations.forEach(duration => {
            frequencyMap[duration] = (frequencyMap[duration] || 0) + 1;
        });
        let mostFrequentValue = 0;
        let maxFrequency = 0;

        for (const [key, count] of Object.entries(frequencyMap)) {
            if (count >= maxFrequency && Number(key) > mostFrequentValue) {
                maxFrequency = count;
                mostFrequentValue = Number(key);
            }
        }

        if (mostFrequentValue % 3600 == 0) {
            this._currTimeOp = 'hour';
            this._currEvery = mostFrequentValue / 3600;
        } else {
            this._currTimeOp = 'minute';
            this._currEvery = mostFrequentValue / 60;
        }
        if (durations[0] != mostFrequentValue) this._currStartTime = timeslots[0].stop ? timeslots[0].stop : '00:00:00';
        else this._currStartTime = '00:00:00';
    }
    render() {
        if (!this.hass || !this.config || !this.entities || !this.actions) return html``;

        const tabLabel = (tab: ETimeTab) => {
            if (tab == ETimeTab.Scheme) return localize('ui.panel.time_picker.time_scheme', getLocale(this.hass!));
            if (tab == ETimeTab.Periodic) return localize('ui.panel.time_picker.time_periodic', getLocale(this.hass!));
            return tab;
        };

        return html`
      <div class="content">
        <div class="header">
          ${this.hass.localize('ui.panel.config.automation.editor.actions.type.device_id.action')}
        </div>
        ${this.renderSummary()}
        ${!this.timeslots
                ? html`
              ${this.getVariableEditor()} ${this.renderDays()}
              <div class="header">${this.hass.localize('ui.dialogs.helper_settings.input_datetime.time')}</div>
              <time-picker
                .hass=${this.hass}
                .value=${this.schedule.timeslots[0].start}
                stepSize=${this.config.time_step || DefaultTimeStep}
                @change=${(ev: Event) => this.updateActiveEntry({ start: (ev.target as HTMLInputElement).value })}
              >
              </time-picker>
            `
                : html`
              ${this.renderDays()}
              <paper-tabs .selected=${this._tabs.indexOf(this._currTab)} @iron-activate=${this._handleTabChanged}>
                ${this._tabs.map(
                    tab =>
                        html`
                      <paper-tab>${tabLabel(tab)}</paper-tab>
                    `
                )}
              </paper-tabs>
              ${this._currTab == ETimeTab.Scheme
                        ? html`
                    <timeslot-editor
                      .hass=${this.hass}
                      .actions=${this.actions}
                      .slots=${this.schedule.timeslots}
                      stepSize=${this.config.time_step || DefaultTimeStep}
                      .large=${this.large}
                      @update=${this.handlePlannerUpdate}
                    >
                    </timeslot-editor>
                  `
                        : html`
                    <div class="outer">
                      <div>
                        <div>
                          <ha-formfield label=${localize('ui.panel.time_picker.hourly', getLocale(this.hass))}>
                            <ha-radio
                              name="time-option"
                              value="hour"
                              @change=${this._handleTimeOptionChange}
                              ?checked=${this._currTimeOp === 'hour'}
                            />
                          </ha-formfield>
                          <ha-formfield label=${localize('ui.panel.time_picker.minutely', getLocale(this.hass))}>
                            <ha-radio
                              name="time-option"
                              value="minute"
                              @change=${this._handleTimeOptionChange}
                              ?checked=${this._currTimeOp === 'minute'}
                            />
                          </ha-formfield>
                        </div>
                        <div>
                          <label>Every</label>
                          <input
                            type="number"
                            id="everyTime"
                            name="everyTime"
                            value=${this._currEvery}
                            @change=${this._handleEveryChange}
                          />
                          <label
                            >${'hour' === this._currTimeOp
                                ? localize('ui.panel.time_picker.hours', getLocale(this.hass))
                                : localize('ui.panel.time_picker.minutes', getLocale(this.hass))}</label
                          >
                        </div>
                      </div>
                      <time-picker
                        .hass=${this.hass}
                        .value=${this._currStartTime}
                        stepSize=${this.config.time_step || DefaultTimeStep}
                        @change=${(ev: Event) =>
                                this._updateStartTime({ start: (ev.target as HTMLInputElement).value })}
                      >
                      </time-picker>
                      <mwc-button @click=${this._applyPeriod}>Apply</mwc-button>
                    </div>
                  `}
              ${this.renderMarkerOptions()} ${this.renderActions()} ${this.getVariableEditor()}
            `}
      </div>

      <div class="buttons ${!this.editItem ? 'centered' : ''}">
        ${this.editItem
                ? html`
              <mwc-button
                class="warning"
                @click=${() => this.dispatchEvent(new CustomEvent('deleteClick', { detail: this.schedule }))}
              >
                ${this.hass.localize('ui.common.delete')}
              </mwc-button>
            `
                : ''}
        <mwc-button
          @click=${() => this.dispatchEvent(new CustomEvent('saveClick', { detail: this.schedule }))}
          ?disabled=${!this.schedule.timeslots.filter(e => e.actions.length).length}
        >
          ${this.hass.localize('ui.common.save')}
        </mwc-button>
      </div>
    `;
    }

    renderSummary() {
        if (!this.entities || !this.actions) return html``;
        return html`
      <div class="summary">
        <div class="summary-entity">
          ${this.entities.map(
            entity => html`
              <div>
                <ha-icon icon="${PrettyPrintIcon(entity.icon)}"> </ha-icon>
                ${capitalize(
                PrettyPrintName(
                    entity.name || this.hass!.states[entity.id].attributes.friendly_name || computeEntity(entity.id)
                )
            )}
              </div>
            `
        )}
        </div>
        <div class="summary-arrow">
          <ha-icon icon="mdi:arrow-right"> </ha-icon>
        </div>
        <div class="summary-action">
          ${this.timeslots
                ? html`
                <div>
                  <ha-icon icon="${PrettyPrintIcon('chart-timeline')}"> </ha-icon>
                  ${capitalize(localize('ui.panel.entity_picker.make_scheme', getLocale(this.hass!)))}
                </div>
              `
                : html`
                <div>
                  <ha-icon icon="${PrettyPrintIcon(this.actions[0].icon || DefaultActionIcon)}"> </ha-icon>
                  ${capitalize(this.actions[0].name || computeEntity(this.actions[0].service))}
                </div>
              `}
        </div>
      </div>
    `;
    }

    renderDays() {
        if (!this.hass) return html``;

        let weekdays = Array.from(Array(7).keys());
        const firstWeekday = startOfWeek(this.hass.language);
        const shiftCount = weekdays.length - weekdayArray.findIndex(e => e.substr(0, 3) == firstWeekday);
        weekdays = [...weekdays.slice(-shiftCount), ...weekdays.slice(0, -shiftCount)];
        const DayOptions = weekdays.map(e =>
            Object({ value: weekdayArray[e].substr(0, 3), name: formatWeekday(e, getLocale(this.hass!), true) })
        );

        const DayTypeOptions = [
            { value: EDayType.Daily, name: localize('ui.components.date.day_types_short.daily', getLocale(this.hass)) },
            { value: EDayType.Workday, name: localize('ui.components.date.day_types_short.workdays', getLocale(this.hass)) },
            { value: EDayType.Weekend, name: localize('ui.components.date.day_types_short.weekend', getLocale(this.hass)) },
            { value: EDayType.Custom, name: localize('ui.components.date.day_types_short.choose', getLocale(this.hass)) },
        ];
        const months = Array.from(Array(12).keys());
        const MonthOptions = months.map(e =>
            Object({ value: monthArray[e].substr(0, 3), name: formatMonth(e, getLocale(this.hass!), true) })
        );

        const MonthTypeOptions = [
            {
                value: EMonthType.Monthly,
                name: localize('ui.components.date.month_types_short.monthly', getLocale(this.hass)),
            },
            { value: EMonthType.Custom, name: localize('ui.components.date.month_types_short.choose', getLocale(this.hass)) },
        ];

        const monthdays = [
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            8,
            9,
            10,
            11,
            12,
            13,
            14,
            15,
            16,
            17,
            18,
            19,
            20,
            21,
            22,
            23,
            24,
            25,
            26,
            27,
            28,
            29,
            30,
            31,
        ];
        const MonthDaysOptions = monthdays.map(e => Object({ value: e, name: e.toString() }));

        const MonthDaysTypeOptions = [
            {
                value: EMonthDaysType.All,
                name: localize('ui.components.date.monthdays_types_short.all', getLocale(this.hass)),
            },
            {
                value: EMonthDaysType.Custom,
                name: localize('ui.components.date.monthdays_types_short.choose', getLocale(this.hass)),
            },
        ];

        return html`
      <div class="header">${localize('ui.components.date.month_types_short.months', getLocale(this.hass))}</div>
      <button-group .items=${MonthTypeOptions} value=${monthType(this.schedule.months)} @change=${this.selectMonths}>
      </button-group>
      ${monthType(this.schedule.months) == EMonthType.Custom
                ? html`
            <div>
              <button-group
                .items=${MonthOptions}
                .value=${this.schedule.months}
                min="1"
                multiple
                @change=${this.selectMonths}
              >
              </button-group>
            </div>
          `
                : ''}
      <div class="header">${localize('ui.components.date.monthdays_types_short.monthdays', getLocale(this.hass))}</div>
      <button-group
        .items=${MonthDaysTypeOptions}
        value=${monthdaysType(this.schedule.monthdays)}
        @change=${this.selectMonthDays}
      >
      </button-group>
      ${monthdaysType(this.schedule.monthdays) == EMonthDaysType.Custom
                ? html`
            <div>
              <button-group
                .items=${MonthDaysOptions}
                .value=${this.schedule.monthdays}
                min="1"
                multiple
                @change=${this.selectMonthDays}
              >
              </button-group>
            </div>
          `
                : ''}
      <div class="header">${localize('ui.components.date.days', getLocale(this.hass))}</div>
      <button-group .items=${DayTypeOptions} value=${weekdayType(this.schedule.weekdays)} @change=${this.selectDays}>
      </button-group>
      ${weekdayType(this.schedule.weekdays) == EDayType.Custom
                ? html`
            <div>
              <button-group
                .items=${DayOptions}
                .value=${this.schedule.weekdays}
                min="1"
                multiple
                @change=${this.selectDays}
              >
              </button-group>
            </div>
          `
                : ''}
    `;
    }

    renderActions() {
        if (!this.hass || this.activeMarker !== null) return;

        const selectedAction =
            this.activeEntry !== null && this.schedule.timeslots[this.activeEntry!].actions.length
                ? this.schedule.timeslots[this.activeEntry!].actions[0]
                : null;

        return html`
      <div class="header">${this.hass.localize('ui.panel.config.automation.editor.actions.type.device_id.action')}</div>
      <button-group
        .items=${this.activeEntry !== null ? this.actions : []}
        .value=${selectedAction !== null
                ? this.actions?.findIndex(e => compareActions(e, selectedAction!, true))
                : null}
        optional="true"
        @change=${this.selectAction}
      >
        ${localize('ui.panel.time_picker.no_timeslot_selected', getLocale(this.hass))}
      </button-group>
    `;
    }

    renderMarkerOptions() {
        if (!this.hass || !this.config || this.activeMarker === null) return;

        const value = this.schedule.timeslots[this.activeMarker].start;
        const res = parseRelativeTime(value);

        const deltaSunrise = stringToTime(value, this.hass) - stringToTime('sunrise+00:00', this.hass),
            deltaSunset = stringToTime(value, this.hass) - stringToTime('sunset+00:00', this.hass);

        const markerOptions = [
            {
                value: 'time',
                name: this.hass.localize('ui.panel.config.automation.editor.triggers.type.time.at'),
                icon: 'mdi:clock-outline',
            },
            {
                value: ETimeEvent.Sunrise,
                name: this.hass.localize('ui.panel.config.automation.editor.conditions.type.sun.sunrise'),
                icon: 'mdi:weather-sunny',
                disabled: Math.abs(deltaSunrise) > 3600 * 6,
            },
            {
                value: ETimeEvent.Sunset,
                name: this.hass.localize('ui.panel.config.automation.editor.conditions.type.sun.sunset'),
                icon: 'mdi:weather-night',
                disabled: Math.abs(deltaSunset) > 3600 * 6,
            },
        ];

        return html`
      <div class="header">${localize('ui.panel.time_picker.time_input_mode', getLocale(this.hass))}</div>
      <button-group .items=${markerOptions} .value=${res ? res.event : 'time'} @change=${this.updateMarkerSetting}>
      </button-group>
    `;
    }

    updateMarkerSetting(ev: Event) {
        const value = (ev.target as HTMLInputElement).value;
        const ts = this.schedule.timeslots[this.activeMarker!].start;

        const res =
            value == 'time'
                ? relToAbsTime(ts, this.hass!, { stepSize: this.config!.time_step })
                : absToRelTime(ts, value as ETimeEvent, this.hass!, { stepSize: this.config!.time_step });

        let timeslots = [...this.schedule.timeslots];
        timeslots = Object.assign(timeslots, {
            [this.activeMarker! - 1]: { ...this.schedule.timeslots[this.activeMarker! - 1], stop: res },
            [this.activeMarker!]: { ...this.schedule.timeslots[this.activeMarker!], start: res },
        });
        this.schedule = { ...this.schedule, timeslots: [...timeslots] };
    }

    updateActiveEntry(data: Partial<Timeslot>) {
        if (this.activeEntry === null) return;
        this.schedule = {
            ...this.schedule,
            timeslots: Object.assign([...this.schedule.timeslots], {
                [this.activeEntry]: { ...this.schedule.timeslots[this.activeEntry], ...data },
            }),
        };
    }

    updateActiveEntryAction(data: Partial<ServiceCall> | null, num: number) {
        if (this.activeEntry === null) return;
        if (data && 'service' in data) {
            this.updateActiveEntry({
                actions: Object.assign([...this.schedule.timeslots[this.activeEntry].actions], {
                    [num]: { ...this.schedule.timeslots[this.activeEntry].actions[num], ...data },
                }),
            });
        } else if (data) {
            //update service_data
            Object.entries(data).forEach(([key, val]) => {
                let actionConfig = [...this.schedule.timeslots[this.activeEntry!].actions];
                let serviceData =
                    typeof val == 'object' && key in this.schedule.timeslots[this.activeEntry!].actions[num]
                        ? { ...actionConfig[num][key], ...val }
                        : val;
                const invalidParams = Object.keys(serviceData).filter(e => serviceData[e] === null);
                if (invalidParams.length) serviceData = omit(serviceData, ...invalidParams);

                actionConfig = Object.assign(actionConfig, {
                    [num]: { ...actionConfig[num], [key]: serviceData },
                });
                this.updateActiveEntry({ actions: actionConfig });
            });
        } else {
            this.updateActiveEntry({
                actions: [...this.schedule.timeslots[this.activeEntry].actions].filter((_, i) => i != num),
            });
        }
    }

    handlePlannerUpdate(ev: CustomEvent) {
        if (ev.detail.hasOwnProperty('entries')) {
            const entries: Timeslot[] = ev.detail.entries;
            if (entries.length < this.schedule.timeslots.length && this.activeEntry == this.schedule.timeslots.length - 1)
                this.activeEntry = this.schedule.timeslots.length - 2;
            this.schedule = {
                ...this.schedule,
                timeslots: [...entries],
            };
        } else if (ev.detail.hasOwnProperty('entry')) {
            this.activeMarker = null;
            this.activeEntry = ev.detail.entry !== null ? Number(ev.detail.entry) : null;
        }
        if (ev.detail.hasOwnProperty('marker')) {
            this.activeEntry = null;
            this.activeMarker = ev.detail.marker !== null ? Number(ev.detail.marker) : null;
        }
    }

    selectAction(ev: CustomEvent) {
        if (!this.actions || this.activeEntry === null) return;
        const action: Action | null = ev.detail;
        if (action) {
            this.entities!.map(e => e.id).forEach((entity_id, num) => {
                this.updateActiveEntryAction(assignAction(entity_id, action), num);
            });
        } else {
            this.entities!.forEach((_, num) => {
                this.updateActiveEntryAction(null, num);
            });
        }
    }

    getVariableEditor() {
        if (this.activeEntry === null || !this.actions) return html``;

        const actions: ServiceCall[] = [];
        this.schedule.timeslots[this.activeEntry].actions.forEach(action => {
            action = omit(action, 'entity_id');
            if (!this.actions!.find(e => compareActions(e, action, true) && Object.keys(e.variables || {}).length)) return;
            if (!actions.some(e => isEqual(e, action))) actions.push(action);
        });

        return actions.map(action => {
            return Object.entries(this.actions!.find(e => compareActions(e, action, true))!.variables!).map(
                ([field, variable]) => {
                    return html`
            <div class="header">
              ${variable.name || PrettyPrintName(field)}
            </div>
            <scheduler-variable-picker
              .variable=${variable}
              .value=${action.service_data ? action.service_data[field] : null}
              @value-changed=${(ev: CustomEvent) =>
                            this.entities!.forEach((_, num) => {
                                this.updateActiveEntryAction(
                                    {
                                        service_data: { [field]: ev.detail.value },
                                    },
                                    num
                                );
                            })}
            >
              ${this.hass!.localize('ui.dialogs.helper_settings.input_select.no_options')}
            </scheduler-variable-picker>
          `;
                }
            );
        });
    }
    selectMonths(ev: Event) {
        const value = (ev.target as HTMLInputElement).value;
        let months = this.schedule.months;
        if (Object.values(EMonthType).includes(value as EMonthType)) {
            switch (value as EMonthType) {
                case EMonthType.Monthly:
                    months = ['monthly'];
                    break;
                case EMonthType.Custom:
                    months = [];
                    break;
            }
        } else {
            months = (value as unknown) as MonthType;
        }
        this.schedule = {
            ...this.schedule,
            months: months,
        };
    }
    selectMonthDays(ev: Event) {
        const value = (ev.target as HTMLInputElement).value;
        let monthdays = this.schedule.monthdays;
        if (Object.values(EMonthDaysType).includes(value as EMonthDaysType)) {
            switch (value as EMonthDaysType) {
                case EMonthDaysType.All:
                    monthdays = ['all'];
                    break;
                case EMonthDaysType.Custom:
                    monthdays = [];
                    break;
            }
        } else {
            monthdays = (value as unknown) as MonthDaysType;
        }
        this.schedule = {
            ...this.schedule,
            monthdays: monthdays,
        };
    }
    selectDays(ev: Event) {
        const value = (ev.target as HTMLInputElement).value;
        let weekdays = this.schedule.weekdays;
        if (Object.values(EDayType).includes(value as EDayType)) {
            switch (value as EDayType) {
                case EDayType.Daily:
                    weekdays = ['daily'];
                    break;
                case EDayType.Workday:
                    weekdays = ['workday'];
                    break;
                case EDayType.Weekend:
                    weekdays = ['weekend'];
                    break;
                case EDayType.Custom:
                    weekdays = [];
                    break;
            }
        } else {
            weekdays = (value as unknown) as WeekdayType;
        }
        this.schedule = {
            ...this.schedule,
            weekdays: weekdays,
        };
    }

    static styles = css`
    ${commonStyle}
    div.summary {
      display: grid;
      grid-template-columns: 1fr max-content 1fr;
      grid-template-areas: 'entity arrow action';
      grid-auto-flow: column;
      grid-gap: 5px;
    }

    div.summary-entity {
      grid-area: entity;
    }
    div.summary-action {
      grid-area: action;
    }
    div.summary-arrow {
      grid-area: arrow;
      color: var(--secondary-text-color);
      display: flex;
      justify-content: center;
      align-items: center;
    }
    div.summary-entity,
    div.summary-action {
      color: var(--dark-primary-color);
      padding: 5px;
      font-size: 14px;
      font-weight: 500;
      --mdc-icon-size: 20px;
      position: relative;
      display: flex;
      flex-direction: column;
      background: rgba(var(--rgb-primary-color), 0.15);
      border-radius: 4px;
      align-items: center;
    }
    div.summary-entity div,
    div.summary-action div {
      display: flex;
      flex-grow: 1;
      margin: 5px;
      width: 100%;
      align-items: center;
    }
    div.summary-entity ha-icon,
    div.summary-action ha-icon {
      display: flex;
      flex: 0 0 30px;
    }
  `;
}
