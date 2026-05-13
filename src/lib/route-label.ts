import type { RouteType } from "@/lib/types";

const labels: Record<RouteType, string> = {
  out_and_back: "Out and back",
  loop: "Loop",
  point_to_point: "Point to point",
};

export function formatRouteType(routeType: RouteType): string {
  return labels[routeType] ?? routeType;
}
