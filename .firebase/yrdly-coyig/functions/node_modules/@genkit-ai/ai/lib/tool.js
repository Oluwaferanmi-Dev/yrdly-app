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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var tool_exports = {};
__export(tool_exports, {
  ToolInterruptError: () => ToolInterruptError,
  asTool: () => asTool,
  defineInterrupt: () => defineInterrupt,
  defineTool: () => defineTool,
  dynamicTool: () => dynamicTool,
  isDynamicTool: () => isDynamicTool,
  isToolRequest: () => isToolRequest,
  isToolResponse: () => isToolResponse,
  lookupToolByName: () => lookupToolByName,
  resolveTools: () => resolveTools,
  toToolDefinition: () => toToolDefinition
});
module.exports = __toCommonJS(tool_exports);
var import_core = require("@genkit-ai/core");
var import_schema = require("@genkit-ai/core/schema");
var import_tracing = require("@genkit-ai/core/tracing");
var import_prompt = require("./prompt.js");
function asTool(registry, action) {
  if (action.__action?.metadata?.type === "tool") {
    return action;
  }
  const fn = (input) => {
    (0, import_tracing.setCustomMetadataAttributes)(registry, { subtype: "tool" });
    return action(input);
  };
  fn.__action = {
    ...action.__action,
    metadata: { ...action.__action.metadata, type: "tool" }
  };
  return fn;
}
async function resolveTools(registry, tools) {
  if (!tools || tools.length === 0) {
    return [];
  }
  return await Promise.all(
    tools.map(async (ref) => {
      if (typeof ref === "string") {
        return await lookupToolByName(registry, ref);
      } else if ((0, import_core.isAction)(ref)) {
        return asTool(registry, ref);
      } else if ((0, import_prompt.isExecutablePrompt)(ref)) {
        return await ref.asTool();
      } else if (ref.name) {
        return await lookupToolByName(
          registry,
          ref.metadata?.originalName || ref.name
        );
      }
      throw new Error("Tools must be strings, tool definitions, or actions.");
    })
  );
}
async function lookupToolByName(registry, name) {
  const tool = await registry.lookupAction(name) || await registry.lookupAction(`/tool/${name}`) || await registry.lookupAction(`/prompt/${name}`);
  if (!tool) {
    throw new Error(`Tool ${name} not found`);
  }
  return tool;
}
function toToolDefinition(tool) {
  const originalName = tool.__action.name;
  let name = originalName;
  if (originalName.includes("/")) {
    name = originalName.substring(originalName.lastIndexOf("/") + 1);
  }
  const out = {
    name,
    description: tool.__action.description || "",
    outputSchema: (0, import_schema.toJsonSchema)({
      schema: tool.__action.outputSchema ?? import_core.z.void(),
      jsonSchema: tool.__action.outputJsonSchema
    }),
    inputSchema: (0, import_schema.toJsonSchema)({
      schema: tool.__action.inputSchema ?? import_core.z.void(),
      jsonSchema: tool.__action.inputJsonSchema
    })
  };
  if (originalName !== name) {
    out.metadata = { originalName };
  }
  return out;
}
function defineTool(registry, config, fn) {
  const a = (0, import_core.defineAction)(
    registry,
    {
      ...config,
      actionType: "tool",
      metadata: { ...config.metadata || {}, type: "tool" }
    },
    (i, runOptions) => {
      return fn(i, {
        ...runOptions,
        context: { ...runOptions.context },
        interrupt: interruptTool(registry)
      });
    }
  );
  implementTool(a, config, registry);
  return a;
}
function implementTool(a, config, registry) {
  a.respond = (interrupt, responseData, options) => {
    if (registry) {
      (0, import_core.assertUnstable)(
        registry,
        "beta",
        "The 'tool.reply' method is part of the 'interrupts' beta feature."
      );
    }
    (0, import_schema.parseSchema)(responseData, {
      jsonSchema: config.outputJsonSchema,
      schema: config.outputSchema
    });
    return {
      toolResponse: (0, import_core.stripUndefinedProps)({
        name: interrupt.toolRequest.name,
        ref: interrupt.toolRequest.ref,
        output: responseData
      }),
      metadata: {
        interruptResponse: options?.metadata || true
      }
    };
  };
  a.restart = (interrupt, resumedMetadata, options) => {
    if (registry) {
      (0, import_core.assertUnstable)(
        registry,
        "beta",
        "The 'tool.restart' method is part of the 'interrupts' beta feature."
      );
    }
    let replaceInput = options?.replaceInput;
    if (replaceInput) {
      replaceInput = (0, import_schema.parseSchema)(replaceInput, {
        schema: config.inputSchema,
        jsonSchema: config.inputJsonSchema
      });
    }
    return {
      toolRequest: (0, import_core.stripUndefinedProps)({
        name: interrupt.toolRequest.name,
        ref: interrupt.toolRequest.ref,
        input: replaceInput || interrupt.toolRequest.input
      }),
      metadata: (0, import_core.stripUndefinedProps)({
        ...interrupt.metadata,
        resumed: resumedMetadata || true,
        // annotate the original input if replacing it
        replacedInput: replaceInput ? interrupt.toolRequest.input : void 0
      })
    };
  };
}
function isToolRequest(part) {
  return !!part.toolRequest;
}
function isToolResponse(part) {
  return !!part.toolResponse;
}
function isDynamicTool(t) {
  return ((0, import_core.isDetachedAction)(t) || (0, import_core.isAction)(t)) && t.__action.metadata?.type === "tool" && t.__action.metadata?.dynamic;
}
function defineInterrupt(registry, config) {
  const { requestMetadata, ...toolConfig } = config;
  return defineTool(
    registry,
    toolConfig,
    async (input, { interrupt }) => {
      if (!config.requestMetadata) interrupt();
      else if (typeof config.requestMetadata === "object")
        interrupt(config.requestMetadata);
      else interrupt(await Promise.resolve(config.requestMetadata(input)));
    }
  );
}
class ToolInterruptError extends Error {
  constructor(metadata) {
    super();
    this.metadata = metadata;
    this.name = "ToolInterruptError";
  }
}
function interruptTool(registry) {
  return (metadata) => {
    (0, import_core.assertUnstable)(registry, "beta", "Tool interrupts are a beta feature.");
    throw new ToolInterruptError(metadata);
  };
}
function dynamicTool(config, fn) {
  const a = (0, import_core.detachedAction)(
    {
      ...config,
      actionType: "tool",
      metadata: { ...config.metadata || {}, type: "tool", dynamic: true }
    },
    (i, runOptions) => {
      const interrupt = interruptTool(runOptions.registry);
      if (fn) {
        return fn(i, {
          ...runOptions,
          context: { ...runOptions.context },
          interrupt
        });
      }
      return interrupt();
    }
  );
  implementTool(a, config);
  return {
    __action: {
      ...a.__action,
      metadata: {
        ...a.__action.metadata,
        type: "tool"
      }
    },
    attach(registry) {
      const bound = a.attach(registry);
      implementTool(bound, config);
      return bound;
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ToolInterruptError,
  asTool,
  defineInterrupt,
  defineTool,
  dynamicTool,
  isDynamicTool,
  isToolRequest,
  isToolResponse,
  lookupToolByName,
  resolveTools,
  toToolDefinition
});
//# sourceMappingURL=tool.js.map