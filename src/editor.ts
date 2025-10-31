import { LitElement, html, nothing } from 'lit';
import {
  HomeAssistant,
  LovelaceCardConfig,
  LovelaceCardEditor,
  fireEvent,
} from 'custom-card-helpers';
import localize from './localize';
import { customElement, property, state } from 'lit/decorators.js';
import {
  Template,
  VacuumCardConfig,
  VacuumCardShortcut,
  VacuumCardStat,
} from './types';
import styles from './editor.css';

type ConfigElement = HTMLInputElement & {
  configValue?: keyof VacuumCardConfig;
};

@customElement('vacuum-card-editor')
export class VacuumCardEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private config!: Partial<VacuumCardConfig>;

  @state() private image? = undefined;
  @state() private compact_view = false;
  @state() private show_name = true;
  @state() private show_status = true;
  @state() private show_toolbar = true;

  setConfig(config: LovelaceCardConfig & VacuumCardConfig): void {
    this.config = config;

    if (!this.config.entity) {
      this.config.entity = this.getEntitiesByType('vacuum')[0] || '';
      fireEvent(this, 'config-changed', { config: this.config });
    }
  }

  private getEntitiesByType(type: string): string[] {
    if (!this.hass) {
      return [];
    }
    return Object.keys(this.hass.states).filter((id) => id.startsWith(type));
  }

  private addShortcut(): void {
    const shortcuts = this.config.shortcuts || [];
    this.config = {
      ...this.config,
      shortcuts: [
        ...shortcuts,
        { name: '', service: '', icon: 'mdi:robot-vacuum' },
      ],
    };
    fireEvent(this, 'config-changed', { config: this.config });
    this.requestUpdate();
  }

  private deleteShortcut(index: number): void {
    const shortcuts = [...(this.config.shortcuts || [])];
    shortcuts.splice(index, 1);
    this.config = {
      ...this.config,
      shortcuts: shortcuts.length > 0 ? shortcuts : undefined,
    };
    fireEvent(this, 'config-changed', { config: this.config });
    this.requestUpdate();
  }

  private updateShortcut(
    index: number,
    field: keyof VacuumCardShortcut,
    value: string,
  ): void {
    const shortcuts = [...(this.config.shortcuts || [])];
    if (field === 'service_data') {
      try {
        shortcuts[index] = {
          ...shortcuts[index],
          [field]: JSON.parse(value),
        };
      } catch (e) {
        return;
      }
    } else {
      shortcuts[index] = { ...shortcuts[index], [field]: value };
    }
    this.config = {
      ...this.config,
      shortcuts,
    };
    fireEvent(this, 'config-changed', { config: this.config });
    this.requestUpdate();
  }

  private addStat(state: string): void {
    const stats = this.config.stats || {};
    if (!stats[state]) {
      stats[state] = [];
    }
    stats[state] = [...stats[state], { attribute: '', unit: '', subtitle: '' }];
    this.config = {
      ...this.config,
      stats,
    };
    fireEvent(this, 'config-changed', { config: this.config });
    this.requestUpdate();
  }

  private deleteStat(state: string, index: number): void {
    const stats = { ...(this.config.stats || {}) };
    stats[state].splice(index, 1);
    if (stats[state].length === 0) {
      delete stats[state];
    }
    this.config = {
      ...this.config,
      stats: Object.keys(stats).length > 0 ? stats : undefined,
    };
    fireEvent(this, 'config-changed', { config: this.config });
    this.requestUpdate();
  }

  private updateStat(
    state: string,
    index: number,
    field: keyof VacuumCardStat,
    value: string,
  ): void {
    const stats = { ...(this.config.stats || {}) };
    stats[state][index] = { ...stats[state][index], [field]: value };
    this.config = {
      ...this.config,
      stats,
    };
    fireEvent(this, 'config-changed', { config: this.config });
    this.requestUpdate();
  }

  protected render(): Template {
    if (!this.hass) {
      return nothing;
    }

    const vacuumEntities = this.getEntitiesByType('vacuum');
    const cameraEntities = [
      ...this.getEntitiesByType('camera'),
      ...this.getEntitiesByType('image'),
    ];
    const statsStates = [
      'default',
      'cleaning',
      'paused',
      'returning',
      'charging',
      'docked',
      'idle',
      'error',
    ];

    return html`
      <div class="card-config">
        <div class="option">
          <ha-select
            .label=${localize('editor.entity')}
            @selected=${this.valueChanged}
            .configValue=${'entity'}
            .value=${this.config.entity}
            @closed=${(e: Event) => e.stopPropagation()}
            fixedMenuPosition
            naturalMenuWidth
            required
            validationMessage=${localize('error.missing_entity')}
          >
            ${vacuumEntities.map(
              (entity) =>
                html` <mwc-list-item .value=${entity}
                  >${entity}</mwc-list-item
                >`,
            )}
          </ha-select>
        </div>

        <div class="option">
          <ha-select
            .label=${localize('editor.map')}
            @selected=${this.valueChanged}
            .configValue=${'map'}
            .value=${this.config.map}
            @closed=${(e: Event) => e.stopPropagation()}
            fixedMenuPosition
            naturalMenuWidth
          >
            ${cameraEntities.map(
              (entity) =>
                html` <mwc-list-item .value=${entity}
                  >${entity}</mwc-list-item
                >`,
            )}
          </ha-select>
        </div>

        <div class="option">
          <paper-input
            label="${localize('editor.image')}"
            .value=${this.image}
            .configValue=${'image'}
            @value-changed=${this.valueChanged}
          ></paper-input>
        </div>

        <div class="option">
          <ha-switch
            aria-label=${localize(
              this.compact_view
                ? 'editor.compact_view_aria_label_off'
                : 'editor.compact_view_aria_label_on',
            )}
            .checked=${Boolean(this.compact_view)}
            .configValue=${'compact_view'}
            @change=${this.valueChanged}
          >
          </ha-switch>
          ${localize('editor.compact_view')}
        </div>

        <div class="option">
          <ha-switch
            aria-label=${localize(
              this.show_name
                ? 'editor.show_name_aria_label_off'
                : 'editor.show_name_aria_label_on',
            )}
            .checked=${Boolean(this.show_name)}
            .configValue=${'show_name'}
            @change=${this.valueChanged}
          >
          </ha-switch>
          ${localize('editor.show_name')}
        </div>

        <div class="option">
          <ha-switch
            aria-label=${localize(
              this.show_status
                ? 'editor.show_status_aria_label_off'
                : 'editor.show_status_aria_label_on',
            )}
            .checked=${Boolean(this.show_status)}
            .configValue=${'show_status'}
            @change=${this.valueChanged}
          >
          </ha-switch>
          ${localize('editor.show_status')}
        </div>

        <div class="option">
          <ha-switch
            aria-label=${localize(
              this.show_toolbar
                ? 'editor.show_toolbar_aria_label_off'
                : 'editor.show_toolbar_aria_label_on',
            )}
            .checked=${Boolean(this.show_toolbar)}
            .configValue=${'show_toolbar'}
            @change=${this.valueChanged}
          >
          </ha-switch>
          ${localize('editor.show_toolbar')}
        </div>

        <div class="section-header">
          <strong>${localize('editor.shortcuts')}</strong>
          <mwc-button @click=${this.addShortcut}>
            ${localize('editor.shortcuts_add')}
          </mwc-button>
        </div>

        ${(this.config.shortcuts || []).map(
          (shortcut, index) => html`
            <div class="shortcut-item">
              <paper-input
                label="${localize('editor.shortcuts_name')}"
                .value=${shortcut.name || ''}
                @value-changed=${(ev: CustomEvent) =>
                  this.updateShortcut(
                    index,
                    'name',
                    (ev.target as HTMLInputElement).value,
                  )}
              ></paper-input>

              <paper-input
                label="${localize('editor.shortcuts_service')}"
                .value=${shortcut.service || ''}
                @value-changed=${(ev: CustomEvent) =>
                  this.updateShortcut(
                    index,
                    'service',
                    (ev.target as HTMLInputElement).value,
                  )}
                placeholder="script.clean_room"
              ></paper-input>

              <paper-input
                label="${localize('editor.shortcuts_icon')}"
                .value=${shortcut.icon || ''}
                @value-changed=${(ev: CustomEvent) =>
                  this.updateShortcut(
                    index,
                    'icon',
                    (ev.target as HTMLInputElement).value,
                  )}
                placeholder="mdi:sofa"
              ></paper-input>

              <paper-input
                label="${localize('editor.shortcuts_service_data')}"
                .value=${JSON.stringify(shortcut.service_data || {})}
                @value-changed=${(ev: CustomEvent) =>
                  this.updateShortcut(
                    index,
                    'service_data',
                    (ev.target as HTMLInputElement).value,
                  )}
                placeholder="{}"
              ></paper-input>

              <mwc-button @click=${() => this.deleteShortcut(index)}>
                ${localize('editor.shortcuts_delete')}
              </mwc-button>
            </div>
          `,
        )}

        <div class="section-header">
          <strong>${localize('editor.stats')}</strong>
          <ha-select
            .label=${localize('editor.stats_state')}
            @selected=${(ev: CustomEvent) => {
              const index = ev.detail.index;
              if (index !== undefined && index >= 0) {
                this.addStat(statsStates[index]);
              }
            }}
            @closed=${(e: Event) => e.stopPropagation()}
            fixedMenuPosition
            naturalMenuWidth
          >
            ${statsStates.map(
              (state) =>
                html` <mwc-list-item
                  >${localize(`editor.stats_${state}`)}</mwc-list-item
                >`,
            )}
          </ha-select>
        </div>

        ${statsStates.map((state) => {
          const stateStats = this.config.stats?.[state] || [];
          if (stateStats.length === 0) return nothing;

          return html`
            <div class="stats-state-group">
              <h4>${localize(`editor.stats_${state}`)}</h4>
              ${stateStats.map(
                (stat, index) => html`
                  <div class="stat-item">
                    <paper-input
                      label="${localize('editor.stats_entity_id')}"
                      .value=${stat.entity_id || ''}
                      @value-changed=${(ev: CustomEvent) =>
                        this.updateStat(
                          state,
                          index,
                          'entity_id',
                          (ev.target as HTMLInputElement).value,
                        )}
                      placeholder="sensor.vacuum_filter"
                    ></paper-input>

                    <paper-input
                      label="${localize('editor.stats_attribute')}"
                      .value=${stat.attribute || ''}
                      @value-changed=${(ev: CustomEvent) =>
                        this.updateStat(
                          state,
                          index,
                          'attribute',
                          (ev.target as HTMLInputElement).value,
                        )}
                      placeholder="battery_level"
                    ></paper-input>

                    <paper-input
                      label="${localize('editor.stats_value_template')}"
                      .value=${stat.value_template || ''}
                      @value-changed=${(ev: CustomEvent) =>
                        this.updateStat(
                          state,
                          index,
                          'value_template',
                          (ev.target as HTMLInputElement).value,
                        )}
                      placeholder="{{ states('sensor.example') }}"
                    ></paper-input>

                    <paper-input
                      label="${localize('editor.stats_unit')}"
                      .value=${stat.unit || ''}
                      @value-changed=${(ev: CustomEvent) =>
                        this.updateStat(
                          state,
                          index,
                          'unit',
                          (ev.target as HTMLInputElement).value,
                        )}
                      placeholder="%"
                    ></paper-input>

                    <paper-input
                      label="${localize('editor.stats_subtitle')}"
                      .value=${stat.subtitle || ''}
                      @value-changed=${(ev: CustomEvent) =>
                        this.updateStat(
                          state,
                          index,
                          'subtitle',
                          (ev.target as HTMLInputElement).value,
                        )}
                      placeholder="Battery"
                    ></paper-input>

                    <mwc-button @click=${() => this.deleteStat(state, index)}>
                      ${localize('editor.stats_delete')}
                    </mwc-button>
                  </div>
                `,
              )}
            </div>
          `;
        })}
      </div>
    `;
  }

  private valueChanged(event: Event): void {
    if (!this.config || !this.hass || !event.target) {
      return;
    }
    const target = event.target as ConfigElement;
    if (
      !target.configValue ||
      this.config[target.configValue] === target?.value
    ) {
      return;
    }
    if (target.configValue) {
      if (target.value === '') {
        delete this.config[target.configValue];
      } else {
        this.config = {
          ...this.config,
          [target.configValue]:
            target.checked !== undefined ? target.checked : target.value,
        };
      }
    }
    fireEvent(this, 'config-changed', { config: this.config });
  }

  static get styles() {
    return styles;
  }
}
