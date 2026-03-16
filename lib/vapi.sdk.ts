import Vapi from "@vapi-ai/web";

let vapiInstance: Vapi | null = null;

/**
 * Lazy singleton for the Vapi SDK.
 * Only instantiated on first call (client-side only).
 */
function getVapiInstance(): Vapi {
  if (!vapiInstance) {
    if (!process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN) {
      throw new Error("NEXT_PUBLIC_VAPI_WEB_TOKEN is not set");
    }
    vapiInstance = new Vapi(process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN);
  }
  return vapiInstance;
}

export { getVapiInstance };
export default getVapiInstance;
