
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import {
  blindIndex,
  createSession,
  decrypt,
  encrypt,
  requireOrgUser,
} from "@/lib/security";
import { organizationKey } from "@/lib/domain";
import { readJsonBody } from "@/lib/request-json";
import { apiError } from "@/lib/api-error";

const TIMEZONES = new Set([
  "Africa/Abidjan",
  "Africa/Accra",
  "Africa/Dakar",
  "Africa/Lagos",
  "Africa/Kinshasa",
  "Africa/Douala",
  "Africa/Casablanca",
  "UTC",
]);

function validateOpeningHours(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value) || value.length > 7) {
    throw new Error("OPENING_HOURS_INVALID");
  }

  const seen = new Set<number>();

  return value.map((entry) => {
    if (!entry || typeof entry !== "object") {
      throw new Error("OPENING_HOURS_INVALID");
    }

    const item = entry as Record<string, unknown>;

    const dayOfWeek = item.dayOfWeek;
    const closed = item.closed;

    if (
      typeof dayOfWeek !== "number" ||
      !Number.isInteger(dayOfWeek) ||
      dayOfWeek < 0 ||
      dayOfWeek > 6 ||
      seen.has(dayOfWeek) ||
      typeof closed !== "boolean"
    ) {
      throw new Error("OPENING_HOURS_INVALID");
    }

    seen.add(dayOfWeek);

    if (closed) {
      return {
        dayOfWeek,
        closed: true,
        openMinute: null,
        closeMinute: null,
      };
    }

    if (
      typeof item.openMinute !== "number" ||
      typeof item.closeMinute !== "number" ||
      !Number.isInteger(item.openMinute) ||
      !Number.isInteger(item.closeMinute) ||
      item.openMinute < 0 ||
      item.openMinute > 1439 ||
      item.closeMinute < 1 ||
      item.closeMinute > 1439 ||
      item.closeMinute <= item.openMinute
    ) {
      throw new Error("OPENING_HOURS_INVALID");
    }

    return {
      dayOfWeek,
      closed: false,
      openMinute: item.openMinute,
      closeMinute: item.closeMinute,
    };
  });
}

export async function GET() {
  try {
    const user = await requireOrgUser(
      "SETTINGS_VIEW",
    );

    const organization =
      await db.organization.findUnique({
        where: {
          id: user.organizationId!,
        },
        include: {
          openingHours: {
            orderBy: {
              dayOfWeek: "asc",
            },
          },
        },
      });

    if (!organization) {
      return NextResponse.json(
        {
          error:
            "Organisation introuvable",
        },
        { status: 404 },
      );
    }

    const key = await organizationKey(
      organization.id,
    );

    return NextResponse.json({
      name: organization.name,
      slug: organization.slug,

      phone: decrypt(
        organization.phoneEncrypted,
        key,
      ),

      whatsapp: decrypt(
        organization.whatsappEncrypted,
        key,
      ),

      email: decrypt(
        organization.emailEncrypted,
        key,
      ),

      address: decrypt(
        organization.addressEncrypted,
        key,
      ),

      logoUrl: organization.logoUrl,

      publicProfileEnabled:
        organization.publicProfileEnabled,

      publicDescription:
        organization.publicDescription,

      city: organization.city,

      neighborhood:
        organization.neighborhood,

      latitude:
        organization.latitude === null
          ? null
          : Number(
              organization.latitude,
            ),

      longitude:
        organization.longitude === null
          ? null
          : Number(
              organization.longitude,
            ),

      timezone:
        organization.timezone,

      openingHours:
        organization.openingHours.map(
          (hour) => ({
            dayOfWeek:
              hour.dayOfWeek,
            openMinute:
              hour.openMinute,
            closeMinute:
              hour.closeMinute,
            closed:
              hour.closed,
          }),
        ),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(
  req: Request,
) {
  try {
    const user =
      await requireOrgUser(
        "SETTINGS_UPDATE",
      );

    const input =
      await readJsonBody(
        req,
        32 * 1024,
      );

    /*
     * NOM
     */
    if (
      typeof input.name !== "string" ||
      !input.name.trim() ||
      input.name.length > 160
    ) {
      return NextResponse.json(
        {
          error:
            "Nom requis ou trop long",
        },
        { status: 400 },
      );
    }

    /*
     * LIMITES DES CHAMPS TEXTE
     */
    const stringLimits: Record<
      string,
      number
    > = {
      phone: 50,
      whatsapp: 50,
      email: 254,
      address: 500,
      publicDescription: 1000,
      city: 100,
      neighborhood: 120,
    };

    for (const [
      field,
      maximum,
    ] of Object.entries(stringLimits)) {
      const value = input[field];

      if (
        value !== undefined &&
        value !== null &&
        (typeof value !== "string" ||
          value.length > maximum)
      ) {
        return NextResponse.json(
          {
            error:
              "Coordonnées ou profil public invalides",
          },
          { status: 400 },
        );
      }
    }

    /*
     * PROFIL PUBLIC
     */
    if (
      input.publicProfileEnabled !==
        undefined &&
      typeof input.publicProfileEnabled !==
        "boolean"
    ) {
      return NextResponse.json(
        {
          error:
            "Activation du profil public invalide",
        },
        { status: 400 },
      );
    }

    /*
     * TIMEZONE
     */
    if (
      input.timezone !== undefined &&
      (typeof input.timezone !==
        "string" ||
        !TIMEZONES.has(
          input.timezone,
        ))
    ) {
      return NextResponse.json(
        {
          error:
            "Fuseau horaire invalide",
        },
        { status: 400 },
      );
    }

    /*
     * COORDONNÉES GPS
     *
     * Le frontend envoie :
     * latitude: number | null
     * longitude: number | null
     *
     * On accepte également l'absence
     * du champ pour conserver la valeur
     * actuelle.
     */
    let latitude:
      | number
      | null
      | undefined;

    let longitude:
      | number
      | null
      | undefined;

    if (
      input.latitude === null ||
      input.latitude === undefined
    ) {
      latitude = input.latitude;
    } else {
      latitude = Number(
        input.latitude,
      );
    }

    if (
      input.longitude === null ||
      input.longitude === undefined
    ) {
      longitude = input.longitude;
    } else {
      longitude = Number(
        input.longitude,
      );
    }

    if (
      latitude !== undefined &&
      latitude !== null &&
      (!Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90)
    ) {
      return NextResponse.json(
        {
          error:
            "Latitude invalide",
        },
        { status: 400 },
      );
    }

    if (
      longitude !== undefined &&
      longitude !== null &&
      (!Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180)
    ) {
      return NextResponse.json(
        {
          error:
            "Longitude invalide",
        },
        { status: 400 },
      );
    }

    /*
     * Si l'une des coordonnées est explicitement
     * supprimée, l'autre doit également l'être.
     */
    if (
      (latitude === null) !==
      (longitude === null)
    ) {
      return NextResponse.json(
        {
          error:
            "Latitude et longitude doivent être renseignées ensemble",
        },
        { status: 400 },
      );
    }

    /*
     * HORAIRES
     */
    let openingHours;

    try {
      openingHours =
        validateOpeningHours(
          input.openingHours,
        );
    } catch (error) {
      if (
        error instanceof Error &&
        error.message ===
          "OPENING_HOURS_INVALID"
      ) {
        return NextResponse.json(
          {
            error:
              "Horaires invalides",
          },
          { status: 400 },
        );
      }

      throw error;
    }

    const organizationId =
      user.organizationId!;

    const key =
      await organizationKey(
        organizationId,
      );

    /*
     * NORMALISATION DES INFORMATIONS
     */
    const phone =
      typeof input.phone === "string"
        ? input.phone.trim()
        : (input.phone as
            | string
            | null
            | undefined);

    const whatsapp =
      typeof input.whatsapp ===
      "string"
        ? input.whatsapp.trim()
        : (input.whatsapp as
            | string
            | null
            | undefined);

    const email =
      typeof input.email === "string"
        ? input.email
            .trim()
            .toLowerCase()
        : (input.email as
            | string
            | null
            | undefined);

    /*
     * CORRECTION :
     * ancienne expression incorrecte :
     * /^[^\s@]+**\.**[^\s@]+$/
     *
     * expression correcte :
     */
    if (
      email &&
      !/^[^\s@]+\.[^\s@]+$/.test(
        email,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "E-mail invalide",
        },
        { status: 400 },
      );
    }

    let emailChanged = false;

    await db.$transaction(
      async (tx) => {
        /*
         * Vérification de l'e-mail
         */
        if (email) {
          const existing =
            await tx.user.findFirst({
              where: {
                email,
                id: {
                  not: user.id,
                },
              },
              select: {
                id: true,
              },
            });

          if (existing) {
            throw new Error(
              "EMAIL_EXISTS",
            );
          }
        }

        /*
         * ORGANISATION
         */
        await tx.organization.update({
          where: {
            id: organizationId,
          },

          data: {
            name: input.name.trim(),

            phoneEncrypted:
              encrypt(
                phone,
                key,
              ),

            phoneBlindIndex:
              blindIndex(
                phone,
                "organization.phone",
                organizationId,
              ),

            whatsappEncrypted:
              encrypt(
                whatsapp,
                key,
              ),

            whatsappBlindIndex:
              blindIndex(
                whatsapp,
                "organization.whatsapp",
                organizationId,
              ),

            emailEncrypted:
              encrypt(
                email,
                key,
              ),

            emailBlindIndex:
              blindIndex(
                email,
                "organization.email",
                organizationId,
              ),

            addressEncrypted:
              encrypt(
                input.address as
                  | string
                  | null
                  | undefined,
                key,
              ),

            publicProfileEnabled:
              input.publicProfileEnabled ===
              undefined
                ? undefined
                : input.publicProfileEnabled,

            publicDescription:
              input.publicDescription ===
              undefined
                ? undefined
                : typeof input.publicDescription ===
                  "string"
                ? input.publicDescription.trim() ||
                  null
                : null,

            city:
              input.city ===
              undefined
                ? undefined
                : typeof input.city ===
                  "string"
                ? input.city.trim() ||
                  null
                : null,

            neighborhood:
              input.neighborhood ===
              undefined
                ? undefined
                : typeof input.neighborhood ===
                  "string"
                ? input.neighborhood.trim() ||
                  null
                : null,

            /*
             * COORDONNÉES GPS
             */
            latitude:
              latitude === undefined
                ? undefined
                : latitude,

            longitude:
              longitude === undefined
                ? undefined
                : longitude,

            timezone:
              input.timezone ===
              undefined
                ? undefined
                : input.timezone,
          },
        });

        /*
         * HORAIRES
         */
        if (
          openingHours !==
          undefined
        ) {
          await tx.organizationOpeningHour.deleteMany(
            {
              where: {
                organizationId,
              },
            },
          );

          if (openingHours.length) {
            await tx.organizationOpeningHour.createMany(
              {
                data: openingHours.map(
                  (hour) => ({
                    ...hour,
                    organizationId,
                  }),
                ),
              },
            );
          }
        }

        /*
         * CHANGEMENT D'E-MAIL DE L'ADMIN
         */
        if (
          email &&
          user.role === "ADMIN" &&
          email !== user.email
        ) {
          emailChanged = true;

          await tx.user.update({
            where: {
              id: user.id,
            },

            data: {
              email,

              emailBlindIndex:
                blindIndex(
                  email,
                  "user.email",
                  organizationId,
                ),
            },
          });

          await tx.session.deleteMany(
            {
              where: {
                userId: user.id,
              },
            },
          );
        }

        /*
         * AUDIT
         */
        await tx.auditLog.create({
          data: {
            userId: user.id,
            organizationId,

            action:
              "SETTINGS_UPDATED",

            entity:
              "Organization",

            entityId:
              organizationId,

            metadata: {
              fields: [
                "name",
                "phone",
                "whatsapp",
                "email",
                "address",
                "publicProfileEnabled",
                "publicDescription",
                "city",
                "neighborhood",
                "latitude",
                "longitude",
                "timezone",
                "openingHours",
              ],
            },
          },
        });
      },
    );

    /*
     * Nouvelle session si l'e-mail
     * de l'ADMIN a changé.
     */
    if (emailChanged) {
      await createSession(
        user.id,
      );
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "EMAIL_EXISTS"
    ) {
      return NextResponse.json(
        {
          error:
            "Cet e-mail est déjà utilisé.",
        },
        { status: 409 },
      );
    }

    return apiError(error);
  }
}