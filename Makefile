SHELL := /bin/bash

dev:
	hugo server --buildDrafts --bind 0.0.0.0 --port 6200 --disableFastRender
.PHONY: server

deploy-github:
	cd cj1128.github.io && git reset --hard && git clean -f -d
	cd cj1128.github.io && git pull
	hugo -d cj1128.github.io && cd cj1128.github.io && git add -A ;\
	git commit -m "Rebuilding site: `date`" ;\
	git push origin master
	echo "Deploy to GitHub Done"
.PHONY: deploy-github

deploy-cn:
	hugo
	rsync --progress -r --update public/ cjdev:/data/cjting.cn/
	echo "Deploy to CN Done"
.PHONY: deploy-cn

deploy:
	make deploy-github
	make deploy-cn
.PHONY: deploy
