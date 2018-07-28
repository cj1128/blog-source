SHELL := /bin/bash

server:
	hugo server --buildDrafts --bind 0.0.0.0 --port 6200
.PHONY: server

deploy:
	hugo
	cd public ;\
	git pull ;\
	git add -A ;\
	git commit -m "Rebuilding site: `date`" ;\
	git push origin master
.PHONY: deploy
