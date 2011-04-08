test:
	expresso -I lib $(TESTFLAGS) tests/*.js

.PHONY: test