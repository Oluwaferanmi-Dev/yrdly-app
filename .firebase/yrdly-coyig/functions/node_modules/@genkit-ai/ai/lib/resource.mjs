import {
  detachedAction,
  GenkitError,
  isAction,
  isDetachedAction,
  z
} from "@genkit-ai/core";
import uriTemplate from "uri-templates";
import { PartSchema } from "./model-types.js";
const ResourceInputSchema = z.object({
  uri: z.string()
});
const ResourceOutputSchema = z.object({
  content: z.array(PartSchema)
});
function defineResource(registry, opts, fn) {
  const action = dynamicResource(opts, fn).attach(registry);
  delete action.__action.metadata?.dynamic;
  action.matches = createMatcher(opts.uri, opts.template);
  registry.registerAction("resource", action);
  return action;
}
async function findMatchingResource(registry, input) {
  for (const actKeys of Object.keys(await registry.listResolvableActions())) {
    if (actKeys.startsWith("/resource/")) {
      const resource = await registry.lookupAction(actKeys);
      if (resource.matches(input)) {
        return resource;
      }
    }
  }
  return void 0;
}
function isDynamicResourceAction(t) {
  return (isDetachedAction(t) || isAction(t)) && t.__action.metadata?.type === "resource" && !!t.__action.metadata?.dynamic;
}
function dynamicResource(opts, fn) {
  const uri = opts.uri ?? opts.template;
  if (!uri) {
    throw new GenkitError({
      status: "INVALID_ARGUMENT",
      message: `must specify either url or template options`
    });
  }
  const matcher = createMatcher(opts.uri, opts.template);
  const action = detachedAction(
    {
      actionType: "resource",
      name: opts.name ?? uri,
      description: opts.description,
      inputSchema: ResourceInputSchema,
      outputSchema: ResourceOutputSchema,
      metadata: {
        resource: {
          uri: opts.uri,
          template: opts.template
        },
        ...opts.metadata,
        type: "resource",
        dynamic: true
      }
    },
    async (input, ctx) => {
      const templateMatch = matcher(input);
      if (!templateMatch) {
        throw new GenkitError({
          status: "INVALID_ARGUMENT",
          message: `input ${input} did not match template ${uri}`
        });
      }
      const parts = await fn(input, ctx);
      parts.content.map((p) => {
        if (!p.metadata) {
          p.metadata = {};
        }
        if (p.metadata?.resource) {
          if (!p.metadata.resource.parent) {
            p.metadata.resource.parent = {
              uri: input.uri
            };
            if (opts.template) {
              p.metadata.resource.parent.template = opts.template;
            }
          }
        } else {
          p.metadata.resource = {
            uri: input.uri
          };
          if (opts.template) {
            p.metadata.resource.template = opts.template;
          }
        }
        return p;
      });
      return parts;
    }
  );
  action.matches = matcher;
  return {
    __action: {
      ...action.__action,
      metadata: {
        ...action.__action.metadata,
        type: "resource"
      }
    },
    attach(registry) {
      const bound = action.attach(registry);
      bound.matches = matcher;
      return bound;
    },
    matches: matcher
  };
}
function createMatcher(uriOpt, templateOpt) {
  if (uriOpt) {
    return (input) => input.uri === uriOpt;
  }
  if (templateOpt) {
    const template = uriTemplate(templateOpt);
    return (input) => template.fromUri(input.uri) !== void 0;
  }
  throw new GenkitError({
    status: "INVALID_ARGUMENT",
    message: "must specify either url or template options"
  });
}
export {
  ResourceInputSchema,
  ResourceOutputSchema,
  defineResource,
  dynamicResource,
  findMatchingResource,
  isDynamicResourceAction
};
//# sourceMappingURL=resource.mjs.map