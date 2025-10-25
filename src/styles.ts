import { css } from 'lit';

export const commonStyle = css`
    .card-header {
      display: flex;
      justify-content: space-between;
    }
    .card-header .name {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: flex;
    }
    .card-header ha-switch {
      padding: 5px;
    }
    .card-header ha-icon-button {
        position: absolute;
        right: 6px;
        top: 6px;
    }
    .card-content {
      flex: 1;
    }
    .card-content > *:first-child {
      margin-top: 0;
    }
    .card-content > *:last-child {
      margin-bottom: 0;
    }
    div.text-field, div.secondary {
      color: var(--secondary-text-color);
    }
    .disabled {
      color: var(--disabled-text-color);
    }
    div.header {
      color: var(--secondary-text-color);
      text-transform: uppercase;
      font-weight: 500;
      font-size: 12px;
      margin: 20px 0px 0px 0px;
      display: flex;
      flex-direction: row;
    }
    div.header .switch {
      text-transform: none;
      font-weight: normal;
      font-size: 14px;
      display: flex;
      flex-grow: 1;
      justify-content: flex-end;
    }
    div.header ha-switch {
      display: flex;
      align-self: center;
      margin: 0px 8px;
      line-height: 24px;
    }
    /* Base transparent style: no background, only blue text */
    ha-button {
        background: transparent;
        margin-right: 6px;
        padding: 0;
    }

    /* The actual button shape and text */
    ha-button::part(base),
    ha-button::part(button) {
        border-radius: 9999px;
        min-width: 48px;
        height: 32px;
        padding: 0 12px;
        background: transparent;
        color: var(--primary-color);
        border: 1px solid transparent;
        transition: background 0.15s ease, color 0.15s ease;
    }

    /* Hover: faint background, brighter text */
    ha-button::part(base):hover,
    ha-button::part(button):hover {
        background: color-mix(in oklab, var(--primary-color) 12%, transparent);
        color: var(--primary-color);
    }

    /* Focus ring */
    ha-button:focus-visible::part(base),
    ha-button:focus-visible::part(button) {
        outline: none;
        box-shadow: 0 0 0 3px color-mix(in oklab, var(--primary-color) 35%, transparent);
    }

    /* Disabled state */
    ha-button[disabled]::part(base),
    ha-button[disabled]::part(button) {
        background: rgba(128,128,128,0.15);
        color: rgba(255,255,255,0.5);
        cursor: not-allowed;
    }

    /* Active / selected (filled color like pushbutton) */
    ha-button.active::part(base),
    ha-button[data-active="true"]::part(base),
    ha-button[aria-pressed="true"]::part(base),
    ha-button.active::part(button),
    ha-button[data-active="true"]::part(button),
    ha-button[aria-pressed="true"]::part(button) {
        background: var(--primary-color);
        color: var(--text-primary-color, #fff);
    }

    /* Optional: alternate highlight color for special cases */
    ha-button.warning::part(base),
    ha-button.warning::part(button) {
        background: var(--error-color);
        color: var(--text-primary-color, #fff);
    }

    /* Selected orange variant (for monthly mode etc.) */
    ha-button.selected::part(base),
    ha-button.selected::part(button) {
        background: var(--warning-color, orange);
        color: var(--text-primary-color, #fff);
    }

    /* Text-style variant (like Cancel button) */
    ha-button[appearance="text"]::part(base),
    ha-button[appearance="text"]::part(button) {
        background: transparent;
        color: var(--primary-color);
    }

    /* Icon spacing inside buttons */
    ha-button ha-icon {
        margin-right: 11px;
    }
    ha-button.active {
      background: var(--primary-color);
      --mdc-theme-primary: var(--text-primary-color);
      border-radius: 4px;
    }      
    ha-button ha-icon {
      margin-right: 11px;
    }
    ha-button.warning {
      --mdc-theme-primary: var(--error-color);
    }
    div.checkbox-container {
      display: grid;
      grid-template-columns: max-content 1fr max-content;
      grid-template-rows: min-content;
      grid-template-areas: "checkbox slider value";
      grid-gap: 0px 10px;
    }
    div.checkbox-container div.checkbox {
      grid-area: checkbox;
      display: flex;
      align-items: center;x
    }
    div.checkbox-container div.slider {
      grid-area: slider;
      display: flex;
      align-items: center;
    }
    div.checkbox-container div.value {
      grid-area: value;
      min-width: 40px;
      display: flex;
      align-items: center;
    }
    a {
      color: var(--primary-color);
    }
    a:visited {
      color: var(--accent-color);
    }

    
    .content {
      padding: 0px 24px 16px 24px;
    }
    .buttons {
      box-sizing: border-box;
      display: flex;
      padding: 24px;
      padding-top: 16px;
      justify-content: space-between;
      padding-bottom: max(env(safe-area-inset-bottom), 24px);
      background-color: var(--mdc-theme-surface, #fff);
      border-top: 1px solid var(--divider-color);
      position: sticky;
      bottom: 0px;
    }
    .buttons.centered {
      flex-wrap: wrap;
      justify-content: center;
    }
  `;

export const dialogStyle = css`
  ha-dialog {
    --mdc-dialog-min-width: 400px;
    --mdc-dialog-max-width: 600px;
    --mdc-dialog-heading-ink-color: var(--primary-text-color);
    --mdc-dialog-content-ink-color: var(--primary-text-color);
    --justify-action-buttons: space-between;
    --dialog-content-padding: 0px;
  }
  ha-dialog .form {
    color: var(--primary-text-color);
  }
  a {
    color: var(--primary-color);
  }
  /* make dialog fullscreen on small screens */
  @media all and (max-width: 450px), all and (max-height: 500px) {
    ha-dialog {
      --mdc-dialog-min-width: calc(100vw - env(safe-area-inset-right) - env(safe-area-inset-left));
      --mdc-dialog-max-width: calc(100vw - env(safe-area-inset-right) - env(safe-area-inset-left));
      --mdc-dialog-min-height: 100%;
      --mdc-dialog-max-height: 100%;
      --vertical-align-dialog: flex-end;
      --ha-dialog-border-radius: 0px;
    }
  }
  ha-button.warning::part(base),
  ha-button.warning::part(button) {
    background: var(--error-color);
    color: var(--text-primary-color, #fff);
  }
  .error {
    color: var(--error-color);
  }
  ha-dialog {
    --dialog-surface-position: static;
    --dialog-content-position: static;
    --vertical-align-dialog: flex-start;
  }
  .content {
    outline: none;
  }
  .heading {
    border-bottom: 1px solid var(--mdc-dialog-scroll-divider-color, rgba(0, 0, 0, 0.12));
  }
  :host([tab='time']) ha-dialog {
    --dialog-content-padding: 0px;
  }
  @media all and (min-width: 600px) and (min-height: 501px) {
    ha-dialog {
      --mdc-dialog-min-width: 560px;
      --mdc-dialog-max-width: 580px;
      --dialog-surface-margin-top: 40px;
      --mdc-dialog-max-height: calc(100% - 72px);
    }
    :host([large]) ha-dialog {
      --mdc-dialog-min-width: 90vw;
      --mdc-dialog-max-width: 90vw;
    }
  }
  ha-tab[disabled],
    ha-tabs [disabled] {
    color: var(--disabled-text-color);
    pointer-events: none;
    opacity: 0.6;
    cursor: not-allowed;
}
`;
