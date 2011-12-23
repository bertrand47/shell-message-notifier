/*
 * Copyright (C) 2011 Marco Barisione <marco@barisione.org>
 * Copyright (C) 2011 Patrick Ulbrich <zulu99@gmx.net>
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
const Shell = imports.gi.Shell;

let label;

function MessageLabel() {
    this._init();
}

MessageLabel.prototype = {
    _init: function() {
        this.mailnag_title = this._get_mailnag_messagetray_title();
        
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
            if ( ((this.mailnag_title != null) && (s.title == this.mailnag_title)) && 
                !s._counterBin.visible ) {
                count += this._get_mailnag_count(s);
            } else if (s._counterBin.visible && s._counterLabel.get_text() != '0') {
                count += Number(s._counterLabel.get_text());
            }
        }

        this.actor.visible = count > 0;
        this.countLabel.set_text(count.toString());

        /* Only notify if we have at least one message, and the count hasn't
         * reduced. */
        if (count > 0 && count >= this.oldCount) {
            this._showSanta();
        }

        this.oldCount = count;
    },
    
    _get_mailnag_count: function(source) {
        /* count is 1 in the following cases:
         * a) single notification mode with just one mail.
         * b) summary notification mode with just one mail,
         *    i.e. title is in singular form and doesn't contain a number 
         *    (e.g. "You have a new mail.").
         */
        let count = 1;
        let content = source.notifications[0]._contentArea.toString();
        
        // summary mode notification -> try to parse count from title
        if (content.indexOf('\n') > 0) {
            let title = source.notifications[0].title;
            let parts = title.split(' ');
            let i = 0;
            while (i < parts.length) {
                let n = Number(parts[i]);
                if (!isNaN(n)) {
                    count = n;
                    break;
                }
                i++;
            }
        }
        
        return count;
    },
    
    _get_mailnag_messagetray_title: function() {
        let mailnag_cfg = GLib.get_home_dir() + '/.config/mailnag/mailnag.cfg';
        let title = null;
        let config = null;
        
        try {
            config = Shell.get_file_contents_utf8_sync(mailnag_cfg);
        } catch (ex) {}
        
        if (config != null) {
            let lines = config.split('\n');
            let i = 0;
            while (i < lines.length) {
                if (lines[i].indexOf('messagetray_label') == 0) {
                    title = lines[i].split('=')[1].trim();
                    break;
                }
                i++;
            }
        }
        
        return title;
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
