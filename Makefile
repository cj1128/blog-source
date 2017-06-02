# 启动hugo, stylus, webpack，开发js和css时使用
dev:
	forego start
.PHONY: dev

# css和js开发完毕后，打包
build-assets:
	stylus -c style/main.styl -o static/css/bundle.css
	cd js && npm run build
.PHONY: build-assets

# 只启动hugo，编写文章时使用
server:
	forego start hugo
.PHONY: server

deploy:
	hugo
	cd public ;\
	git add -A ;\
	git commit -m "Rebuilding site `date`" ;\
	git push origin master
.PHONY: deploy
