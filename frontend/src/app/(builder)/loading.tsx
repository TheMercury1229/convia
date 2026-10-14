import { AiGenerationLoader, BUILDER_LOADING_STAGES } from "@/components/builder/ai-generation-loader";

export default function BuilderRouteLoading() {
  return <AiGenerationLoader stages={BUILDER_LOADING_STAGES} />;
}
