SHELL := /bin/bash

dev:
	hugo server --buildDrafts --bind 0.0.0.0 --port 6200
.PHONY: server

deploy:
	cd cj1128.github.io && git reset --hard && git clean -f -d
	cd cj1128.github.io && git pull
	hugo -d cj1128.github.io && cd cj1128.github.io && git add -A ;\
	git commit -m "Rebuilding site: `date`" ;\
	git push origin master
.PHONY: deploy
