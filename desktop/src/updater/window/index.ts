import Vue from "vue/dist/vue.js";
import { UpdaterComponent } from "./updater.component";

const updaterVueApp = new Vue({
    components: {
        updater: UpdaterComponent,
    },
});
updaterVueApp.$mount("#app");
