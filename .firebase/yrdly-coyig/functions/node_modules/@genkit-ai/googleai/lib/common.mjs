import process from "process";
function getApiKeyFromEnvVar() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
}
export {
  getApiKeyFromEnvVar
};
//# sourceMappingURL=common.mjs.map