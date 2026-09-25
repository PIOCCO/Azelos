import helmet from "helmet";

export function isProduction() {
  return process.env.NODE_ENV === "production";
}

/** Build Helmet options including a production-aware CSP. */
export function buildHelmetOptions() {
  const apiUrl = process.env.VITE_API_URL || process.env.API_PUBLIC_URL || "";
  const frontendOrigins = (process.env.ALLOWED_ORIGINS || process.env.CLIENT_ORIGIN || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const connectSrc = ["'self'", ...frontendOrigins];
  if (apiUrl) connectSrc.push(apiUrl.replace(/\/+$/, ""));
  connectSrc.push("https://accounts.google.com", "https://oauth2.googleapis.com");

  const imgSrc = ["'self'", "data:", "blob:", "https:"];

  return {
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc,
        connectSrc,
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: isProduction() ? [] : null,
      },
    },
    hsts: isProduction()
      ? { maxAge: 31536000, includeSubDomains: true, preload: false }
      : false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    permissionsPolicy: {
      features: {
        camera: [],
        microphone: [],
        geolocation: [],
        payment: [],
      },
    },
  };
}

export function applySecurityMiddleware(app) {
  app.use(helmet(buildHelmetOptions()));
}
