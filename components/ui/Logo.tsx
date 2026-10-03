"use client";

import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  variant?: "full" | "icon";
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  href?: string;
};

export default function Logo({
  variant = "full",
  width,
  height,
  className = "",
  priority = false,
  href,
}: LogoProps) {
  const isIcon = variant === "icon";

  const image = (
    <Image
      src={
        isIcon
          ? "/logo/icon-logo-imprim-brain.png"
          : "/logo/logo-imprim-brain-white.png"
      }
      alt={
        isIcon
          ? "Imprim'Brain"
          : "Imprim'Brain — Gestion intelligente pour imprimeries"
      }
      width={width ?? (isIcon ? 48 : 180)}
      height={height ?? (isIcon ? 48 : 52)}
      priority={priority}
      className={`h-auto w-auto object-contain ${className}`}
    />
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label="Accueil Imprim'Brain"
        className="inline-flex shrink-0 items-center"
      >
        {image}
      </Link>
    );
  }

  return (
    <div className="inline-flex shrink-0 items-center">
      {image}
    </div>
  );
}