type BrandMarkProps = {
  className?: string;
  /** Invert primary strokes/fills for dark backgrounds. */
  dark?: boolean;
};

const ACCENT = "#C5A059";

function markColors(dark: boolean) {
  return {
    primary: dark ? "#FFFFFF" : "#111111",
    accent: ACCENT,
  };
}

/** Arch frame, gold apex, thin R — primary RIFAQ mark. */
function ArchMark({ primary, accent }: { primary: string; accent: string }) {
  return (
    <g>
      <path
        d="M22 78V34C22 22 34 14 50 14C66 14 78 22 78 34V78"
        stroke={primary}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="50" cy="26" r="3.5" fill={accent} />
      <path
        d="M40 72V36H54C60.0751 36 65 40.4772 65 46.5C65 52.5228 60.0751 57 54 57H40M52 57L64 72"
        stroke={primary}
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </g>
  );
}

export const BrandMark = ({ className = "h-8 w-8", dark = false }: BrandMarkProps) => {
  const { primary, accent } = markColors(dark);
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`block shrink-0 ${className}`}
      role="img"
      aria-label="RIFAQ"
    >
      <ArchMark primary={primary} accent={accent} />
    </svg>
  );
};

export const BrandWordmark = ({ className = "h-10 w-auto", dark = false }: BrandMarkProps) => {
  const { primary, accent } = markColors(dark);
  return (
    <svg
      viewBox="0 0 340 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`block shrink-0 ${className}`}
      role="img"
      aria-label="RIFAQ"
    >
      <ArchMark primary={primary} accent={accent} />
      <text
        x="118"
        y="58"
        fill={primary}
        fontSize="36"
        fontWeight="600"
        letterSpacing="0.28em"
        fontFamily="'Cormorant Garamond', Georgia, serif"
      >
        RIFAQ
      </text>
      <line
        x1="118"
        y1="72"
        x2="318"
        y2="72"
        stroke={dark ? "#FFFFFF55" : "#D4D4D0"}
        strokeWidth="1"
      />
    </svg>
  );
};

export const BrandLockup = ({ className = "h-28 w-auto", dark = false }: BrandMarkProps) => {
  const { primary, accent } = markColors(dark);
  return (
    <svg
      viewBox="0 0 220 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`block shrink-0 ${className}`}
      role="img"
      aria-label="RIFAQ"
    >
      <g transform="translate(60 0)">
        <ArchMark primary={primary} accent={accent} />
      </g>
      <text
        x="110"
        y="128"
        textAnchor="middle"
        fill={primary}
        fontSize="28"
        fontWeight="600"
        letterSpacing="0.28em"
        fontFamily="'Cormorant Garamond', Georgia, serif"
      >
        RIFAQ
      </text>
      <line
        x1="48"
        y1="140"
        x2="172"
        y2="140"
        stroke={dark ? "#FFFFFF55" : "#D4D4D0"}
        strokeWidth="1"
      />
    </svg>
  );
};
