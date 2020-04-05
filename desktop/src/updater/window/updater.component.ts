import Vue from "vue/dist/vue.js";

const {ipcRenderer} = require("electron");

export const UpdaterComponent = Vue.component("Updater", {
    data: () => {
        return {
            updateStatus: null,
            progressPercent: null,
        };
    },
    computed: {
        windowStyle: () => {
            return {
                width: "100%",
                height: "100%",
                background: "#111",
                margin: 0,
                "-webkit-app-region": "drag",
            };
        },
        wrapper: () => {
            return {
                display: "flex",
                height: "100%",
                width: "100%",
                "flex-direction": "column",
                "align-items": "center",
                "justify-content": "center",
                "transform-origin": "center",
            };
        },
        logo: () => {
            return {
                height: "100px",
                width: "200px",
                "margin-bottom": "5px",
                "background-color": "#aaa",
                "-webkit-mask": "url('../app/assets/icons/elevate.svg') no-repeat center",
                mask: "url('../app/assets/icons/elevate.svg') no-repeat center",
                animation: "fadeAnimation 2s infinite",
            };
        },
        status: () => {
            return {
                color: "#aaa",
                "font-size": "12px",
                "font-family": "Helvetica, Verdana, sans-serif",
                "margin-bottom": "8px",
            };
        }
    },
    beforeCreate() {
        ipcRenderer.on("update-status", (event, text) => {
            this.updateStatus = text;
        });

        ipcRenderer.on("download-progress", (event, progress) => {
            this.updateStatus = "Downloading update...";
            this.progressPercent = progress.percent;

            if (this.progressPercent >= 100) { // Download completed
                setTimeout(() => {
                    this.updateStatus = "Update downloaded.";
                }, 500);
            }
        });
    },
    created() {
        console.log("Updater component created.");
    },
    template: `
        <div :style="windowStyle">
            <div :style="wrapper">
                <div :style="logo">logo</div>
                <div :style="status" v-if="updateStatus">{{updateStatus}}</div>
                <progress style="width: 300px;" max="100" v-if="progressPercent !== null" :value="progressPercent"></progress>
            </div>
        </div>
    `
});
