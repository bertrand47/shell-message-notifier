/*
 * Copyright (C) 2011 Marco Barisione <marco@barisione.org>
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 */

const Main = imports.ui.main;
const St = imports.gi.St;

let label;

function MessageLabel() {
    this._init();
}

MessageLabel.prototype = {
    _init: function() {
        this.countLabel = new St.Label();

        this.actor = new St.Button({name: 'messageButton'});
        this.actor.set_child(this.countLabel);

        this._updateText();
    },

    _updateText: function() {
        this.countLabel.set_text('0');
    }
};

function init() {
    label = new MessageLabel();
}

function enable() {
    Main.panel._rightBox.insert_actor(label.actor, 0);
}

function disable() {
    Main.panel._rightBox.remove_actor(label);
}
