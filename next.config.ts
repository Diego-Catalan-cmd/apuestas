import withPWAInit from "@ducanh2912/next-pwa";
import type { NextConfig } from "next";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development", // Se desactiva en modo desarrollo para facilitar el trabajo
  register: true,
});

const nextConfig: NextConfig = {
  /* Aquí puedes mantener cualquier otra configuración existente */
};

export default withPWA(nextConfig);