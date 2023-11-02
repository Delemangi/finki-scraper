import { readFileSync } from "node:fs";

export const config: Config = JSON.parse(
  readFileSync("./config/config.json", "utf8"),
);
