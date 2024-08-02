import { defineConfig } from "vite";
import path from "path";


export default defineConfig({
  define: {
    "process.env.BABEL_TYPES_8_BREAKING": "false",
    // "_path().sep":path.sep
    
    // `'${path.sep}/'`,
  },
});
