import { defineConfig } from "umi";
import routes from "./routes";

export default defineConfig({
  history: { type: "hash" },
  publicPath: "/",

  routes: routes,

  plugins: [
    "@umijs/plugins/dist/request",
    "@umijs/plugins/dist/antd",
    "@umijs/plugins/dist/layout",
    "@umijs/plugins/dist/initial-state",
    "@umijs/plugins/dist/model",
    "@umijs/plugins/dist/access",
  ],

  initialState: {},
  model: {},
  access: {},
  antd: {
    configProvider: {
      locale: "en_US",
    },
  },
  request: {
    dataField: "data",
  },
  layout: {
    title: "Thesis Workspace",
    locale: false,
    layout: "side",
  },

  npmClient: "npm",

 
  define: {
    "process.env.UMI_APP_API_URL": process.env.UMI_APP_API_URL || "",
    "process.env.REACT_APP_API_URL": process.env.REACT_APP_API_URL || process.env.UMI_APP_API_URL || "",
  },

  proxy: {
    "/api": {
      target: "http://localhost:5000",
      changeOrigin: true,
    },
  },
});
