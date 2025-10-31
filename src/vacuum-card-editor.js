import { LitElement, html, css } from 'lit-element';
import { fireEvent } from 'custom-card-helpers';
import localize from './localize';

export class VacuumCardEditor extends LitElement {
  static get properties() {
    return {
      hass: Object,
      _config: Object,
      _toggle: Boolean,
    };
  }

  setConfig(config) {
    this._config = config;

    if (!this._config.entity) {
      this._config.entity = this.getEntitiesByType('vacuum')[0] || '';
      fireEvent(this, 'config-changed', { config: this._config });
    }
  }

  get _entity() {
    if (this._config) {
      return this._config.entity || '';
    }

    return '';
  }

  get _map() {
    if (this._config) {
      return this._config.map || '';
    }

    return '';
  }

  get _image() {
    if (this._config) {
      return this._config.image || '';
    }

    return '';
  }

  get _show_name() {
    if (this._config) {
      return this._config.show_name || true;
    }

    return '';
  }

  get _show_status() {
    if (this._config) {
      return this._config.show_status || true;
    }

    return '';
  }

  get _show_toolbar() {
    if (this._config) {
      return this._config.show_toolbar || true;
    }

    return true;
  }

  get _compact_view() {
    if (this._config) {
      return this._config.compact_view || false;
    }

    return false;
  }

  get _actions() {
    if (this._config) {
      return this._config.actions || [];
    }

    return [];
  }

  get _stats() {
    if (this._config) {
      return this._config.stats || {};
    }

    return {};
  }

  getEntitiesByType(type) {
    return Object.keys(this.hass.states).filter(
      (eid) => eid.substr(0, eid.indexOf('.')) === type
    );
  }

  _addAction() {
    const actions = [...this._actions, { name: '', service: '', icon: 'mdi:robot-vacuum', service_data: {} }];
    this._config = {
      ...this._config,
      actions
    };
    fireEvent(this, 'config-changed', { config: this._config });
    this.requestUpdate();
  }

  _deleteAction(index) {
    const actions = [...this._actions];
    actions.splice(index, 1);
    this._config = {
      ...this._config,
      actions: actions.length > 0 ? actions : undefined
    };
    fireEvent(this, 'config-changed', { config: this._config });
    this.requestUpdate();
  }

  _updateAction(index, field, value) {
    const actions = [...this._actions];
    if (field === 'service_data') {
      try {
        actions[index] = { ...actions[index], [field]: JSON.parse(value) };
      } catch (e) {
        // Invalid JSON, keep the string for now
        return;
      }
    } else {
      actions[index] = { ...actions[index], [field]: value };
    }
    this._config = {
      ...this._config,
      actions
    };
    fireEvent(this, 'config-changed', { config: this._config });
    this.requestUpdate();
  }

  _addStat(state = 'default') {
    const stats = { ...this._stats };
    if (!stats[state]) {
      stats[state] = [];
    }
    stats[state] = [...stats[state], { attribute: '', unit: '', subtitle: '' }];
    this._config = {
      ...this._config,
      stats
    };
    fireEvent(this, 'config-changed', { config: this._config });
    this.requestUpdate();
  }

  _deleteStat(state, index) {
    const stats = { ...this._stats };
    stats[state].splice(index, 1);
    if (stats[state].length === 0) {
      delete stats[state];
    }
    this._config = {
      ...this._config,
      stats: Object.keys(stats).length > 0 ? stats : undefined
    };
    fireEvent(this, 'config-changed', { config: this._config });
    this.requestUpdate();
  }

  _updateStat(state, index, field, value) {
    const stats = { ...this._stats };
    stats[state][index] = { ...stats[state][index], [field]: value };
    this._config = {
      ...this._config,
      stats
    };
    fireEvent(this, 'config-changed', { config: this._config });
    this.requestUpdate();
  }

  render() {
    if (!this.hass) {
      return html``;
    }

    const vacuumEntities = this.getEntitiesByType('vacuum');
    const cameraEntities = this.getEntitiesByType('camera');
    const statsStates = ['default', 'cleaning', 'paused', 'returning', 'charging', 'error'];

    return html`
      <div class="card-config">
        <paper-dropdown-menu
          label="${localize('editor.entity')}"
          @value-changed=${this._valueChanged}
          .configValue=${'entity'}
        >
          <paper-listbox
            slot="dropdown-content"
            .selected=${vacuumEntities.indexOf(this._entity)}
          >
            ${vacuumEntities.map((entity) => {
              return html` <paper-item>${entity}</paper-item> `;
            })}
          </paper-listbox>
        </paper-dropdown-menu>

        <paper-dropdown-menu
          label="${localize('editor.map')}"
          @value-changed=${this._valueChanged}
          .configValue=${'map'}
        >
          <paper-listbox
            slot="dropdown-content"
            .selected=${cameraEntities.indexOf(this._map)}
          >
            ${cameraEntities.map((entity) => {
              return html` <paper-item>${entity}</paper-item> `;
            })}
          </paper-listbox>
        </paper-dropdown-menu>

        <paper-input
          label="${localize('editor.image')}"
          .value=${this._image}
          .configValue=${'image'}
          @value-changed=${this._valueChanged}
        ></paper-input>

        <ha-switch
          style="margin: 10px auto;"
          aria-label=${localize(
            this._compact_view
              ? 'editor.compact_view_aria_label_off'
              : 'editor.compact_view_aria_label_on'
          )}
          .checked=${this._compact_view !== false}
          .configValue=${'compact_view'}
          @change=${this._valueChanged}
        >
          ${localize('editor.compact_view')}
        </ha-switch>

        <ha-switch
          style="margin: 10px auto;"
          aria-label=${localize(
            this._show_name
              ? 'editor.show_name_aria_label_off'
              : 'editor.show_name_aria_label_on'
          )}
          .checked=${this._show_name !== false}
          .configValue=${'show_name'}
          @change=${this._valueChanged}
        >
          ${localize('editor.show_name')}
        </ha-switch>

        <ha-switch
          style="margin: 10px auto;"
          aria-label=${localize(
            this._show_status
              ? 'editor.show_status_aria_label_off'
              : 'editor.show_status_aria_label_on'
          )}
          .checked=${this._show_status !== false}
          .configValue=${'show_status'}
          @change=${this._valueChanged}
        >
          ${localize('editor.show_status')}
        </ha-switch>

        <ha-switch
          style="margin: 10px auto;"
          aria-label=${localize(
            this._show_name
              ? 'editor.show_toolbar_aria_label_off'
              : 'editor.show_toolbar_aria_label_on'
          )}
          .checked=${this._show_toolbar !== false}
          .configValue=${'show_toolbar'}
          @change=${this._valueChanged}
        >
          ${localize('editor.show_toolbar')}
        </ha-switch>

        <div class="section-header">
          <strong>${localize('editor.actions')}</strong>
          <button @click=${this._addAction} class="add-button">
            ${localize('editor.actions_add')}
          </button>
        </div>

        ${this._actions.map((action, index) => html`
          <div class="action-item">
            <paper-input
              label="${localize('editor.actions_name')}"
              .value=${action.name || ''}
              @value-changed=${(ev) => this._updateAction(index, 'name', ev.target.value)}
            ></paper-input>

            <paper-input
              label="${localize('editor.actions_service')}"
              .value=${action.service || ''}
              @value-changed=${(ev) => this._updateAction(index, 'service', ev.target.value)}
              placeholder="script.clean_room"
            ></paper-input>

            <paper-input
              label="${localize('editor.actions_icon')}"
              .value=${action.icon || ''}
              @value-changed=${(ev) => this._updateAction(index, 'icon', ev.target.value)}
              placeholder="mdi:sofa"
            ></paper-input>

            <paper-input
              label="${localize('editor.actions_service_data')}"
              .value=${JSON.stringify(action.service_data || {})}
              @value-changed=${(ev) => this._updateAction(index, 'service_data', ev.target.value)}
              placeholder="{}"
            ></paper-input>

            <button @click=${() => this._deleteAction(index)} class="delete-button">
              ${localize('editor.actions_delete')}
            </button>
          </div>
        `)}

        <div class="section-header">
          <strong>${localize('editor.stats')}</strong>
          <paper-dropdown-menu label="${localize('editor.stats_state')}" class="stats-state-selector">
            <paper-listbox slot="dropdown-content" @selected-changed=${(ev) => {
              if (ev.detail.value !== undefined && ev.detail.value !== null) {
                this._addStat(statsStates[ev.detail.value]);
              }
            }}>
              ${statsStates.map((state) => html`
                <paper-item>${localize(`editor.stats_${state}`)}</paper-item>
              `)}
            </paper-listbox>
          </paper-dropdown-menu>
        </div>

        ${statsStates.map((state) => {
          const stateStats = this._stats[state] || [];
          if (stateStats.length === 0) return '';

          return html`
            <div class="stats-state-group">
              <h4>${localize(`editor.stats_${state}`)}</h4>
              ${stateStats.map((stat, index) => html`
                <div class="stat-item">
                  <paper-input
                    label="${localize('editor.stats_attribute')}"
                    .value=${stat.attribute || ''}
                    @value-changed=${(ev) => this._updateStat(state, index, 'attribute', ev.target.value)}
                    placeholder="battery_level"
                  ></paper-input>

                  <paper-input
                    label="${localize('editor.stats_unit')}"
                    .value=${stat.unit || ''}
                    @value-changed=${(ev) => this._updateStat(state, index, 'unit', ev.target.value)}
                    placeholder="%"
                  ></paper-input>

                  <paper-input
                    label="${localize('editor.stats_subtitle')}"
                    .value=${stat.subtitle || ''}
                    @value-changed=${(ev) => this._updateStat(state, index, 'subtitle', ev.target.value)}
                    placeholder="Battery"
                  ></paper-input>

                  <button @click=${() => this._deleteStat(state, index)} class="delete-button">
                    ${localize('editor.stats_delete')}
                  </button>
                </div>
              `)}
            </div>
          `;
        })}
      </div>
    `;
  }

  _valueChanged(ev) {
    if (!this._config || !this.hass) {
      return;
    }
    const target = ev.target;
    if (this[`_${target.configValue}`] === target.value) {
      return;
    }
    if (target.configValue) {
      if (target.value === '') {
        delete this._config[target.configValue];
      } else {
        this._config = {
          ...this._config,
          [target.configValue]:
            target.checked !== undefined ? target.checked : target.value,
        };
      }
    }
    fireEvent(this, 'config-changed', { config: this._config });
  }

  static get styles() {
    return css`
      .card-config paper-dropdown-menu {
        width: 100%;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 20px;
        margin-bottom: 10px;
      }

      .add-button {
        background-color: var(--primary-color);
        color: var(--text-primary-color);
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      }

      .add-button:hover {
        opacity: 0.8;
      }

      .action-item,
      .stat-item {
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        padding: 12px;
        margin-bottom: 12px;
        background-color: var(--card-background-color);
      }

      .delete-button {
        background-color: var(--error-color);
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 8px;
        font-size: 12px;
      }

      .delete-button:hover {
        opacity: 0.8;
      }

      .stats-state-group {
        margin-bottom: 20px;
      }

      .stats-state-group h4 {
        margin: 10px 0;
        color: var(--primary-text-color);
      }

      .stats-state-selector {
        width: 200px;
        margin-left: 10px;
      }
    `;
  }
}

customElements.define('vacuum-card-editor', VacuumCardEditor);
