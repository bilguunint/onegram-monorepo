.PHONY: help app-get app-run app-build-apk app-build-ios app-test app-clean \
        admin-install admin-run admin-build admin-test admin-lint admin-clean \
        nextjs-install nextjs-dev nextjs-build nextjs-start nextjs-lint nextjs-clean nextjs-deploy \
        fn-install fn-lint fn-serve fn-shell fn-deploy fn-logs fn-clean \
        deploy clean

help:
	@echo "Onegram monorepo commands"
	@echo ""
	@echo "Flutter app (app/):"
	@echo "  make app-get         flutter pub get"
	@echo "  make app-run         flutter run"
	@echo "  make app-build-apk   flutter build apk --release"
	@echo "  make app-build-ios   flutter build ios --release"
	@echo "  make app-test        flutter test"
	@echo "  make app-clean       flutter clean"
	@echo ""
	@echo "Admin web (admin/):"
	@echo "  make admin-install   npm install using admin-local cache"
	@echo "  make admin-run       ng serve via npm start"
	@echo "  make admin-build     ng build"
	@echo "  make admin-test      ng test"
	@echo "  make admin-lint      ng lint"
	@echo "  make admin-clean     remove node_modules and dist"
	@echo ""
	@echo "Next.js admin (nextjs-admin/):"
	@echo "  make nextjs-install  npm install"
	@echo "  make nextjs-dev      next dev (http://localhost:3000)"
	@echo "  make nextjs-build    next build"
	@echo "  make nextjs-start    next start (production server, after build)"
	@echo "  make nextjs-lint     next lint"
	@echo "  make nextjs-clean    remove node_modules and .next/out"
	@echo "  make nextjs-deploy   build + firebase deploy --only hosting:admin-omm-next"
	@echo ""
	@echo "Cloud Functions (functions/):"
	@echo "  make fn-install      npm install"
	@echo "  make fn-lint         npm run lint"
	@echo "  make fn-serve        firebase emulators:start --only functions"
	@echo "  make fn-shell        firebase functions:shell"
	@echo "  make fn-deploy       firebase deploy --only functions"
	@echo "  make fn-logs         firebase functions:log"
	@echo "  make fn-clean        remove node_modules"
	@echo ""
	@echo "  make deploy          deploy functions (alias for fn-deploy)"
	@echo "  make clean           clean app, admin, and functions"

# ---------- Flutter app ----------
app-get:
	cd app && flutter pub get

app-run:
	cd app && flutter run

app-build-apk:
	cd app && flutter build apk --release

app-build-ios:
	cd app && flutter build ios --release

app-test:
	cd app && flutter test

app-clean:
	cd app && flutter clean

# ---------- Admin web ----------
admin-install:
	cd admin && npm install --cache .npm-cache

admin-run:
	cd admin && npm start

admin-build:
	cd admin && npm run build

admin-test:
	cd admin && npm test

admin-lint:
	cd admin && npm run lint

admin-clean:
	rm -rf admin/node_modules admin/dist admin/.angular

# ---------- Next.js admin ----------
nextjs-install:
	cd nextjs-admin && npm install

nextjs-dev:
	cd nextjs-admin && npm run dev

nextjs-build:
	cd nextjs-admin && npm run build

nextjs-start:
	cd nextjs-admin && npm run start

nextjs-lint:
	cd nextjs-admin && npm run lint

nextjs-clean:
	rm -rf nextjs-admin/node_modules nextjs-admin/.next nextjs-admin/out

nextjs-deploy:
	cd nextjs-admin && npm run build && firebase deploy --only hosting:admin-omm-next

# ---------- Cloud Functions ----------
fn-install:
	cd functions && npm install

fn-lint:
	cd functions && npm run lint

fn-serve:
	firebase emulators:start --only functions

fn-shell:
	firebase functions:shell

fn-deploy:
	firebase deploy --only functions

fn-logs:
	firebase functions:log

fn-clean:
	rm -rf functions/node_modules

# ---------- Combined ----------
deploy: fn-deploy

clean: app-clean admin-clean fn-clean
