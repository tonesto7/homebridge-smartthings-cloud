dist/%.js: src/%.ts
	tsc

.PHONY: dev
dev: dist/main.js
	DEBUG=* homebridge --debug --user-storage-path . --plugin-path .

.PHONY: clean
clean:
	rm -rf accessories persist
