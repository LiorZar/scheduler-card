import { HomeAssistant } from 'custom-card-helpers';
import { CardConfig } from '../../types';
import { entityFilter } from './entity_filter';
import { computeActions } from '../actions/compute_actions';
import { computeStates } from '../compute_states';
import { NotifyDomain } from '../../const';

export function computeEntities(
    hass: HomeAssistant,
    config: CardConfig,
    options: { filterActions: boolean; filterStates: boolean } = { filterActions: true, filterStates: false }
) {
    let entities = Object.keys(hass.states).filter(e => entityFilter(e, config));
    entities = entities.filter(e => !e.startsWith('conx.'));
    entities.push('conx.play_sk', 'conx.cueplay', 'conx.radio_set');

    if (NotifyDomain in hass.services) {
        entities = [
            ...entities,
            ...Object.keys(hass.services[NotifyDomain])
                .map(e => `notify.${e}`)
                .filter(e => entityFilter(e, config)),
        ];
    }

    if (options.filterActions && options.filterStates)
        entities = entities.filter(e => computeActions(e, hass, config).length || computeStates(e, hass, config));
    else if (options.filterActions) entities = entities.filter(e => computeActions(e, hass, config).length);
    else if (options.filterStates) entities = entities.filter(e => computeStates(e, hass, config));

    return entities;
}
