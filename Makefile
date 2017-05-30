dev:
	forego start
.PHONY: dev

deploy:
	hugo
	cd public ;\
	git add -A ;\
	git commit -m "Rebuilding site `date`" ;\
	git push origin master
.PHONY: deploy

build-assets:
	stylus -c style/main.styl -o static/css/bundle.css
	cd js && npm run build
.PHONY: build-assets
