import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { haversineKm, openingStatus } from '@/lib/public-print-shop';
import { apiError } from '@/lib/api-error';

const MAX_QUERY = 120;
const MAX_PAGE = 20;
const PAGE_SIZE = 30;
const MAX_NEARBY_CANDIDATES = 600;

function numberParam(value: string | null, min: number, max: number) {
  if (value === null || value === '') return null;

  const number = Number(value);

  return Number.isFinite(number) && number >= min && number <= max
    ? number
    : null;
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;

    const q = params.get('q')?.trim() ?? '';
    const service = params.get('service')?.trim() ?? '';
    const city = params.get('city')?.trim() ?? '';
    const neighborhood = params.get('neighborhood')?.trim() ?? '';

    const lat = numberParam(params.get('lat'), -90, 90);
    const lng = numberParam(params.get('lng'), -180, 180);

    const pageValue = Number(params.get('page') ?? '1');

    const page =
      Number.isInteger(pageValue) &&
      pageValue >= 1 &&
      pageValue <= MAX_PAGE
        ? pageValue
        : 1;

    if (
      q.length > MAX_QUERY ||
      service.length > MAX_QUERY ||
      city.length > MAX_QUERY ||
      neighborhood.length > MAX_QUERY
    ) {
      return NextResponse.json(
        { error: 'Recherche trop longue.' },
        { status: 400 },
      );
    }

    if ((lat === null) !== (lng === null)) {
      return NextResponse.json(
        { error: 'Coordonnées invalides.' },
        { status: 400 },
      );
    }

    const text = q
      ? [
          {
            name: {
              contains: q,
              mode: 'insensitive' as const,
            },
          },
          {
            city: {
              contains: q,
              mode: 'insensitive' as const,
            },
          },
          {
            neighborhood: {
              contains: q,
              mode: 'insensitive' as const,
            },
          },
          {
            services: {
              some: {
                active: true,
                name: {
                  contains: q,
                  mode: 'insensitive' as const,
                },
              },
            },
          },
        ]
      : [];

    const where = {
      status: 'ACTIVE' as const,

      publicProfileEnabled: true,

      subscriptions: {
        some: {
          status: 'ACTIVE' as const,
          expiresAt: {
            gt: new Date(),
          },
        },
      },

      ...(text.length
        ? {
            OR: text,
          }
        : {}),

      ...(city
        ? {
            city: {
              contains: city,
              mode: 'insensitive' as const,
            },
          }
        : {}),

      ...(neighborhood
        ? {
            neighborhood: {
              contains: neighborhood,
              mode: 'insensitive' as const,
            },
          }
        : {}),

      ...(service
        ? {
            services: {
              some: {
                active: true,
                OR: [
                  {
                    name: {
                      contains: service,
                      mode: 'insensitive' as const,
                    },
                  },
                  {
                    category: {
                      contains: service,
                      mode: 'insensitive' as const,
                    },
                  },
                ],
              },
            },
          }
        : {}),
    };

    /**
     * On récupère au maximum 600 imprimeries.
     *
     * Cette limite commune évite le problème de typage Prisma
     * provoqué par un `take` conditionnel entre 600 et PAGE_SIZE + 1.
     *
     * La pagination est ensuite effectuée côté serveur après
     * le classement éventuel par distance.
     */
    const rows = await db.organization.findMany({
      where,

      select: {
        id: true,
        slug: true,
        name: true,
        logoUrl: true,
        publicDescription: true,
        city: true,
        neighborhood: true,
        latitude: true,
        longitude: true,
        timezone: true,

        openingHours: {
          orderBy: {
            dayOfWeek: 'asc',
          },
          select: {
            dayOfWeek: true,
            openMinute: true,
            closeMinute: true,
            closed: true,
          },
        },

        services: {
          where: {
            active: true,
          },
          select: {
            id: true,
            name: true,
            category: true,
          },
          orderBy: {
            name: 'asc',
          },
          take: 20,
        },
      },

      orderBy: [
        {
          name: 'asc',
        },
        {
          id: 'asc',
        },
      ],

      take: MAX_NEARBY_CANDIDATES,
    });

    const rankedRows = rows.map((row) => ({
      row,

      distanceKm:
        lat !== null &&
        lng !== null &&
        row.latitude !== null &&
        row.longitude !== null
          ? haversineKm(
              lat,
              lng,
              Number(row.latitude),
              Number(row.longitude),
            )
          : null,
    }));

    /**
     * En mode "autour de moi", on classe les imprimeries
     * par distance réelle.
     */
    if (lat !== null && lng !== null) {
      rankedRows.sort(
        (a, b) =>
          (a.distanceKm ?? Number.POSITIVE_INFINITY) -
            (b.distanceKm ?? Number.POSITIVE_INFINITY) ||
          a.row.name.localeCompare(b.row.name, 'fr') ||
          a.row.id.localeCompare(b.row.id),
      );
    }

    const start = (page - 1) * PAGE_SIZE;

    const pageRows = rankedRows.slice(
      start,
      start + PAGE_SIZE,
    );

    const hasMore = start + PAGE_SIZE < rankedRows.length;

    const result = pageRows.map(({ row, distanceKm }) => {
      const formattedOpeningHours = row.openingHours.map(
        (hour) => ({
          dayOfWeek: hour.dayOfWeek,

          open:
            hour.openMinute === null
              ? null
              : `${Math.floor(hour.openMinute / 60)
                  .toString()
                  .padStart(2, '0')}:${(hour.openMinute % 60)
                  .toString()
                  .padStart(2, '0')}`,

          close:
            hour.closeMinute === null
              ? null
              : `${Math.floor(hour.closeMinute / 60)
                  .toString()
                  .padStart(2, '0')}:${(hour.closeMinute % 60)
                  .toString()
                  .padStart(2, '0')}`,

          closed: hour.closed,
        }),
      );

      return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        logoUrl: row.logoUrl,

        description:
          row.publicDescription ||
          'Imprimerie et services d’impression.',

        city: row.city,
        neighborhood: row.neighborhood,

        latitude:
          row.latitude === null
            ? null
            : Number(row.latitude),

        longitude:
          row.longitude === null
            ? null
            : Number(row.longitude),

        timezone: row.timezone,

        distanceKm:
          distanceKm === null
            ? null
            : Math.round(distanceKm * 10) / 10,

        services: row.services,

        openingHours: row.openingHours,

        ...openingStatus(
          formattedOpeningHours,
          row.timezone,
        ),
      };
    });

    return NextResponse.json({
      items: result,
      page,
      pageSize: PAGE_SIZE,
      hasMore,
    });
  } catch (error) {
    return apiError(error);
  }
}