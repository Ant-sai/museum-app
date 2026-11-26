import { createApp } from "vue";
import App from "./App.vue";
// Self-hosted fonts: they work offline and no third-party request is made.
import "@fontsource/instrument-sans/400.css";
import "@fontsource/instrument-sans/500.css";
import "@fontsource/ibm-plex-mono/400.css";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./style.css";

createApp(App).mount("#app");
