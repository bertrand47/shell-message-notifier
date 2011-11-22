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

const Lang = imports.lang;
const Main = imports.ui.main;
const MessageTray = imports.ui.messageTray;
const Tweener = imports.ui.tweener;
const St = imports.gi.St;
const Clutter = imports.gi.Clutter;
const GLib = imports.gi.GLib;

let label;

function MessageLabel() {
    this._init();
}

MessageLabel.prototype = {
    _init: function() {
        this.countLabel = new St.Label({style_class: 'message-label'});

        this.actor = new St.Button({name: 'messageButton',
                                    style_class: 'message-button'});
        this.actor.set_child(this.countLabel);

        this.updateCount();

        this.oldCount = 0;
        this.actor.connect('button-press-event',
            Lang.bind(this, this._showSanta));
    },

    /* Implements the suggestion at the end of
     * https://bugzilla.gnome.org/show_bug.cgi?id=641723#c81 */
    _showSanta: function() {
        if (this.santa)
            return;

        /* Only in December. */
        if (GLib.DateTime.new_now_local().get_month() != 12)
            return;

        /* Not always... */
        if (GLib.random_int_range(0, 100) != 0)
            return;

        this.santa = Clutter.Texture.new_from_file(
            GLib.get_home_dir() +
            '/.local/share/gnome-shell/extensions' +
            '/message-notifier@shell-extensions.barisione.org' +
            '/notification-icon.jpg');
        Main.uiGroup.add_actor(this.santa);

        this.santa.opacity = 255;

        let monitor = Main.layoutManager.primaryMonitor;
        this.santa.set_position(
            monitor.x + Math.floor(monitor.width / 2 - this.santa.width / 2),
            monitor.y + Math.floor(monitor.height / 2 - this.santa.height / 2));

        Tweener.addTween(this.santa,
            { opacity: 0,
              time: 2,
              transition: 'easeOutQuad',
              onComplete: Lang.bind(this, this._hideSanta)
            });
    },

    _hideSanta: function() {
        Main.uiGroup.remove_actor(this.santa);
        this.santa = null;
    },

    updateCount: function() {
        let count = 0;

        let items = Main.messageTray._summaryItems;
        for (let i = 0; i < items.length; i++) {
            let s = items[i].source;
            if (s._counterBin.visible && s._counterLabel.get_text() != '0') {
                count++;
            }
        }

        this.countLabel.visible = count > 0;
        this.countLabel.set_text(count.toString());

        /* Only notify if we have at least one message, and the count hasn't
         * reduced. */
        if (count > 0 && count >= this.oldCount) {
            this._showSanta();
        }

        this.oldCount = count;
    }
};

function customSetCount(count, visible) {
    let fallbackSetCount = Lang.bind(this, originalSetCount);
    fallbackSetCount(count, visible);

    label.updateCount();
}

let originalSetCount;

function init() {
    originalSetCount = MessageTray.Source.prototype._setCount;

    label = new MessageLabel();
}

function enable() {
    MessageTray.Source.prototype._setCount = customSetCount;

    Main.panel._rightBox.insert_actor(label.actor, 0);
}

function disable() {
    MessageTray.Source.prototype._setCount = originalSetCount;

    Main.panel._rightBox.remove_actor(label.actor);
}
