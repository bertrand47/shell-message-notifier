EXT_DIR="$(HOME)/.local/share/gnome-shell/extensions"
UUID=`cat metadata.json  | grep uuid | sed -e 's/^\s*"uuid":\s*"\([^"]*\)",$$/\1/'`
FILES="README extension.js stylesheet.css metadata.json"

all:

install:
	mkdir -p $(EXT_DIR)/$(UUID)
	for f in "$(FILES)"; do \
	    cp -f $$f $(EXT_DIR)/$(UUID)/$$f; \
	done

uninstall:
	for f in "$(FILES)"; do \
	    rm $(EXT_DIR)/$(UUID)/$$f; \
	done
	rmdir $(EXT_DIR)/$(UUID)

