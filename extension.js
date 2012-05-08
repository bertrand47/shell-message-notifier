/*
 * Copyright (C) 2011 Marco Barisione <marco@barisione.org>
 * Copyright (C) 2011, 2012 Patrick Ulbrich <zulu99@gmx.net>
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
const St = imports.gi.St;
const PanelMenu = imports.ui.panelMenu;
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

        this.actor = new PanelMenu.Button({name: 'messageButton',
                                    style_class: 'message-button'});
        this.actor.actor.add_actor(this.countLabel);

        this.updateCount();
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

        this.actor.actor.visible = count > 0;
        this.countLabel.set_text(count.toString());
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
}

function enable() {
    originalSetCount = MessageTray.Source.prototype._setCount;
    MessageTray.Source.prototype._setCount = customSetCount;
    
    label = new MessageLabel();
    Main.panel.addToStatusArea('message-notifier', label.actor, 0);
}

function disable() {
    MessageTray.Source.prototype._setCount = originalSetCount;
    originalSetCount = null;
     
    label.actor.destroy();
    label = null;
}
