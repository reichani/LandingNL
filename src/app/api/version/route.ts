import { BUILD_COMMIT, BUILD_TIME } from "@/generated/build-meta";

export async function GET() {
  return Response.json(
    {
      service: "landingnl",
      commit: BUILD_COMMIT,
      builtAt: BUILD_TIME,
    },
    {
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}
