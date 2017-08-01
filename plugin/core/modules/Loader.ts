export class Loader {

    protected loadingFinished: any;
    protected totalRequired: any;
    protected loadCount: number;

    require(scripts: string[], loadingFinished: Function): void {

        this.loadCount = 0;
        this.totalRequired = scripts.length;
        this.loadingFinished = loadingFinished;

        for (let i: number = 0; i < scripts.length; i++) {
            this.writeScript(chrome.extension.getURL(scripts[i]));
        }
    }

    loaded(): void {
        this.loadCount++;
        if (this.loadCount == this.totalRequired && typeof this.loadingFinished === "function") this.loadingFinished();
    }

    writeScript(src: string): void {

        const ext: string = src.substr(src.lastIndexOf(".") + 1);

        const head: HTMLElement = document.getElementsByTagName("head")[0];

        if (ext === "js") {
            const s: HTMLScriptElement = document.createElement("script");
            s.type = "text/javascript";
            s.async = false;
            s.src = src;
            s.addEventListener("load", () => {
                this.loaded();
            }, false);
            head.appendChild(s);
        } else if (ext === "css") {
            const link: HTMLLinkElement = document.createElement("link");
            link.href = src;
            link.addEventListener("load", () => {
                this.loaded();
            }, false);
            // link.async = false;
            link.type = "text/css";
            link.rel = "stylesheet";
            head.appendChild(link);
        }
    }

    injectJS(codeString: string): void {
        const inner: HTMLScriptElement = document.createElement("script");
        inner.textContent = codeString;
        (document.head || document.documentElement).appendChild(inner);
    }
}
