import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import {
  DEFAULT_BASE_LAT,
  DEFAULT_BASE_LNG,
  parseLatLngParams,
} from "@/lib/coords";
import { prisma } from "@/lib/db";
import { isAccessMode } from "@/lib/trail-dto";
import { getTrailById } from "@/lib/trail-queries";
import type { AccessMode } from "@/lib/types";
import { TrailDetailClient } from "./trail-detail-client";

export default async function TrailDetailPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ base?: string; mode?: string; baseLat?: string; baseLng?: string }>;
}) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const trail = await getTrailById(id);

  if (!trail) {
    notFound();
  }

  const baseLocationName = searchParams.base ?? "Banff town centre";
  const modeParam = searchParams.mode;
  const mode: AccessMode = modeParam && isAccessMode(modeParam) ? modeParam : "transit";

  const parsed = parseLatLngParams(searchParams.baseLat, searchParams.baseLng);
  const usingDefaultBase = parsed === null;
  const baseLat = parsed?.lat ?? DEFAULT_BASE_LAT;
  const baseLng = parsed?.lng ?? DEFAULT_BASE_LNG;

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  let isSaved = false;
  let savedRowId: string | null = null;
  if (userId) {
    const saved = await prisma.savedTrail.findUnique({
      where: {
        userId_trailId: { userId, trailId: id },
      },
    });
    isSaved = saved !== null;
    savedRowId = saved?.id ?? null;
  }

  return (
    <TrailDetailClient
      trail={trail}
      baseLocationName={baseLocationName}
      baseLat={baseLat}
      baseLng={baseLng}
      mode={mode}
      usingDefaultBase={usingDefaultBase}
      isLoggedIn={Boolean(userId)}
      isSaved={isSaved}
      savedRowId={savedRowId}
    />
  );
}
