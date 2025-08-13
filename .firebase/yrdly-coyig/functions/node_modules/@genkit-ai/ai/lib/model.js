"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var model_exports = {};
__export(model_exports, {
  CustomPartSchema: () => import_document.CustomPartSchema,
  DataPartSchema: () => import_document.DataPartSchema,
  MediaPartSchema: () => import_document.MediaPartSchema,
  TextPartSchema: () => import_document.TextPartSchema,
  ToolRequestPartSchema: () => import_document.ToolRequestPartSchema,
  ToolResponsePartSchema: () => import_document.ToolResponsePartSchema,
  defineBackgroundModel: () => defineBackgroundModel,
  defineGenerateAction: () => import_action.defineGenerateAction,
  defineModel: () => defineModel,
  getBasicUsageStats: () => getBasicUsageStats,
  modelActionMetadata: () => modelActionMetadata,
  modelRef: () => modelRef,
  resolveModel: () => resolveModel,
  simulateConstrainedGeneration: () => import_middleware.simulateConstrainedGeneration
});
module.exports = __toCommonJS(model_exports);
var import_core = require("@genkit-ai/core");
var import_logging = require("@genkit-ai/core/logging");
var import_schema = require("@genkit-ai/core/schema");
var import_node_perf_hooks = require("node:perf_hooks");
var import_document = require("./document.js");
var import_model_types = require("./model-types.js");
var import_middleware = require("./model/middleware.js");
var import_action = require("./generate/action.js");
__reExport(model_exports, require("./model-types.js"), module.exports);
function defineModel(registry, options, runner) {
  const label = options.label || options.name;
  const middleware = getModelMiddleware(options);
  const act = (0, import_core.defineAction)(
    registry,
    {
      actionType: "model",
      name: options.name,
      description: label,
      inputSchema: import_model_types.GenerateRequestSchema,
      outputSchema: import_model_types.GenerateResponseSchema,
      metadata: {
        model: {
          label,
          customOptions: options.configSchema ? (0, import_schema.toJsonSchema)({ schema: options.configSchema }) : void 0,
          versions: options.versions,
          supports: options.supports
        }
      },
      use: middleware
    },
    (input, ctx) => {
      const startTimeMs = import_node_perf_hooks.performance.now();
      const secondParam = options.apiVersion === "v2" ? ctx : ctx.streamingRequested ? ctx.sendChunk : void 0;
      return runner(input, secondParam).then((response) => {
        const timedResponse = {
          ...response,
          latencyMs: import_node_perf_hooks.performance.now() - startTimeMs
        };
        return timedResponse;
      });
    }
  );
  Object.assign(act, {
    __configSchema: options.configSchema || import_core.z.unknown()
  });
  return act;
}
function defineBackgroundModel(registry, options) {
  const label = options.label || options.name;
  const middleware = getModelMiddleware(options);
  const act = (0, import_core.defineBackgroundAction)(registry, {
    actionType: "background-model",
    name: options.name,
    description: label,
    inputSchema: import_model_types.GenerateRequestSchema,
    outputSchema: import_model_types.GenerateResponseSchema,
    metadata: {
      model: {
        label,
        customOptions: options.configSchema ? (0, import_schema.toJsonSchema)({ schema: options.configSchema }) : void 0,
        versions: options.versions,
        supports: options.supports
      }
    },
    use: middleware,
    async start(request) {
      const startTimeMs = import_node_perf_hooks.performance.now();
      const response = await options.start(request);
      Object.assign(response, {
        latencyMs: import_node_perf_hooks.performance.now() - startTimeMs
      });
      return response;
    },
    async check(op) {
      return options.check(op);
    },
    cancel: options.cancel ? async (op) => {
      if (!options.cancel) {
        throw new import_core.GenkitError({
          status: "UNIMPLEMENTED",
          message: "cancel not implemented"
        });
      }
      return options.cancel(op);
    } : void 0
  });
  Object.assign(act, {
    __configSchema: options.configSchema || import_core.z.unknown()
  });
  return act;
}
function getModelMiddleware(options) {
  const middleware = [
    ...options.use || [],
    (0, import_middleware.validateSupport)(options)
  ];
  if (!options?.supports?.context) middleware.push((0, import_middleware.augmentWithContext)());
  const constratedSimulator = (0, import_middleware.simulateConstrainedGeneration)();
  middleware.push((req, next) => {
    if (!options?.supports?.constrained || options?.supports?.constrained === "none" || options?.supports?.constrained === "no-tools" && (req.tools?.length ?? 0) > 0) {
      return constratedSimulator(req, next);
    }
    return next(req);
  });
  return middleware;
}
function modelActionMetadata({
  name,
  info,
  configSchema,
  background
}) {
  return {
    actionType: background ? "background-model" : "model",
    name,
    inputJsonSchema: (0, import_schema.toJsonSchema)({ schema: import_model_types.GenerateRequestSchema }),
    outputJsonSchema: background ? (0, import_schema.toJsonSchema)({ schema: import_core.OperationSchema }) : (0, import_schema.toJsonSchema)({ schema: import_model_types.GenerateResponseSchema }),
    metadata: {
      model: {
        ...info,
        customOptions: configSchema ? (0, import_schema.toJsonSchema)({ schema: configSchema }) : void 0
      }
    }
  };
}
function modelRef(options) {
  const ref = { ...options };
  ref.withConfig = (cfg) => {
    return modelRef({
      ...options,
      config: cfg
    });
  };
  ref.withVersion = (version) => {
    return modelRef({
      ...options,
      version
    });
  };
  return ref;
}
function getBasicUsageStats(input, response) {
  const inputCounts = getPartCounts(input.flatMap((md) => md.content));
  const outputCounts = getPartCounts(
    Array.isArray(response) ? response.flatMap((c) => c.message.content) : response.content
  );
  return {
    inputCharacters: inputCounts.characters,
    inputImages: inputCounts.images,
    inputVideos: inputCounts.videos,
    inputAudioFiles: inputCounts.audio,
    outputCharacters: outputCounts.characters,
    outputImages: outputCounts.images,
    outputVideos: outputCounts.videos,
    outputAudioFiles: outputCounts.audio
  };
}
function getPartCounts(parts) {
  return parts.reduce(
    (counts, part) => {
      const isImage = part.media?.contentType?.startsWith("image") || part.media?.url?.startsWith("data:image");
      const isVideo = part.media?.contentType?.startsWith("video") || part.media?.url?.startsWith("data:video");
      const isAudio = part.media?.contentType?.startsWith("audio") || part.media?.url?.startsWith("data:audio");
      return {
        characters: counts.characters + (part.text?.length || 0),
        images: counts.images + (isImage ? 1 : 0),
        videos: counts.videos + (isVideo ? 1 : 0),
        audio: counts.audio + (isAudio ? 1 : 0)
      };
    },
    { characters: 0, images: 0, videos: 0, audio: 0 }
  );
}
async function resolveModel(registry, model, options) {
  let out;
  let modelId;
  if (!model) {
    model = await registry.lookupValue("defaultModel", "defaultModel");
  }
  if (!model) {
    throw new import_core.GenkitError({
      status: "INVALID_ARGUMENT",
      message: "Must supply a `model` to `generate()` calls."
    });
  }
  if (typeof model === "string") {
    modelId = model;
    out = { modelAction: await lookupModel(registry, model) };
  } else if (model.hasOwnProperty("__action")) {
    modelId = model.__action.name;
    out = { modelAction: model };
  } else {
    const ref = model;
    modelId = ref.name;
    out = {
      modelAction: await lookupModel(registry, ref.name),
      config: {
        ...ref.config
      },
      version: ref.version
    };
  }
  if (!out.modelAction) {
    throw new import_core.GenkitError({
      status: "NOT_FOUND",
      message: `Model '${modelId}' not found`
    });
  }
  if (options?.warnDeprecated && out.modelAction.__action.metadata?.model?.stage === "deprecated") {
    import_logging.logger.warn(
      `Model '${out.modelAction.__action.name}' is deprecated and may be removed in a future release.`
    );
  }
  return out;
}
async function lookupModel(registry, model) {
  return await registry.lookupAction(`/model/${model}`) || await registry.lookupAction(`/background-model/${model}`);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CustomPartSchema,
  DataPartSchema,
  MediaPartSchema,
  TextPartSchema,
  ToolRequestPartSchema,
  ToolResponsePartSchema,
  defineBackgroundModel,
  defineGenerateAction,
  defineModel,
  getBasicUsageStats,
  modelActionMetadata,
  modelRef,
  resolveModel,
  simulateConstrainedGeneration,
  ...require("./model-types.js")
});
//# sourceMappingURL=model.js.map