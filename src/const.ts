import { CardConfig } from './types';

export const CARD_VERSION = 'v3.2.15';

export const DefaultTimeStep = 10;

export const DefaultGroupIcon = 'folder-outline';
export const DefaultEntityIcon = 'folder-outline';
export const DefaultActionIcon = 'flash';
export const DeadEntityName = '(unknown entity)';
export const DeadEntityIcon = 'help-circle-outline';

export const FieldTemperature = 'temperature';
export const WorkdaySensor = 'binary_sensor.workday_sensor';

export const ConxDomain = 'conx';
export const NotifyDomain = 'notify';

export enum ETabOptions {
    Entity = 'entity',
    Time = 'time',
    Options = 'options',
}
export enum ETimeTab {
    Scheme = 'scheme',
    Periodic = 'periodic',
}

export const DefaultCardConfig: CardConfig = {
    type: 'scheduler-card',
    discover_existing: true,
    standard_configuration: true,
    include: [],
    exclude: [],
    groups: [],
    customize: {},
    title: true,
    time_step: 10,
    show_header_toggle: false,
    display_options: {
        primary_info: 'default',
        secondary_info: ['relative-time', 'additional-tasks'],
        icon: 'action',
    },
    tags: [],
    sort_by: ['relative-time', 'state'],
    sk_path: 'sk',
};

export const WebsocketEvent = 'scheduler_updated';
