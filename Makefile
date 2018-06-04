SHELL := /bin/bash

server:
	hugo server --buildDrafts --bind 0.0.0.0 --port 6200
.PHONY: server

deploy:
	hugo
	cd fate-lovely.github.io ;\
	git pull ;\
	git add -A ;\
	git commit -m "Rebuilding site: `date`" ;\
	git push origin master
.PHONY: deploy
