all: clean bundle
bundle: clean
	@zip -r ../build/StravaPlus.zip * -x=*.git* -x=*.sh* -x=*docs* -x=*.DS_Store* -x=*Makefile* -x=*.gitignore*
	@echo "Generated extension file StravaPlus.zip"
clean:
	@rm -f ../build/StravaPlus.zip
.PHONY: bundle