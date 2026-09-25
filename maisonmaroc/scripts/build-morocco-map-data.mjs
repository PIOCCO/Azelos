/**
 * Builds SVG path data from geoBoundaries MAR ADM1 (CC BY 4.0 / ODbL).
 * Run: node scripts/build-morocco-map-data.mjs /path/to/geoBoundaries-MAR-ADM1_simplified.geojson
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const geoPath = process.argv[2] || "/tmp/mar-adm1-simple.geojson";
const outPath = path.join(__dirname, "../src/data/moroccoMapPaths.ts");

const geo = JSON.parse(fs.readFileSync(geoPath, "utf8"));

const WIDTH = 420;
const HEIGHT = 520;
const PAD = 18;

function collectCoords(geom) {
  const rings = [];
  if (geom.type === "Polygon") rings.push(geom.coordinates[0]);
  else if (geom.type === "MultiPolygon") {
    for (const poly of geom.coordinates) rings.push(poly[0]);
  }
  return rings;
}

let minLon = Infinity;
let maxLon = -Infinity;
let minLat = Infinity;
let maxLat = -Infinity;

for (const f of geo.features) {
  for (const ring of collectCoords(f.geometry)) {
    for (const [lon, lat] of ring) {
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    }
  }
}

function project(lon, lat) {
  const x = PAD + ((lon - minLon) / (maxLon - minLon)) * (WIDTH - PAD * 2);
  const y = PAD + ((maxLat - lat) / (maxLat - minLat)) * (HEIGHT - PAD * 2);
  return [Math.round(x * 100) / 100, Math.round(y * 100) / 100];
}

function ringToPath(ring) {
  return ring
    .map(([lon, lat], i) => {
      const [x, y] = project(lon, lat);
      return `${i === 0 ? "M" : "L"}${x} ${y}`;
    })
    .join(" ")
    .concat(" Z");
}

function geometryToPath(geom) {
  if (geom.type === "Polygon") return ringToPath(geom.coordinates[0]);
  if (geom.type === "MultiPolygon") {
    return geom.coordinates.map((poly) => ringToPath(poly[0])).join(" ");
  }
  return "";
}

const regions = geo.features
  .map((f) => {
    const name = f.properties.shapeName;
    const slug = name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return {
      id: slug,
      name,
      oriental: name === "Oriental",
      path: geometryToPath(f.geometry),
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

const oriental = regions.find((r) => r.oriental);

function sampleRing(geom, step = 6) {
  const ring = geom.type === "Polygon" ? geom.coordinates[0] : geom.coordinates[0][0];
  const pts = [];
  for (let i = 0; i < ring.length; i += step) {
    pts.push(project(ring[i][0], ring[i][1]));
  }
  return pts;
}

const orientalFeature = geo.features.find((f) => f.properties.shapeName === "Oriental");
const orientalSample = orientalFeature ? sampleRing(orientalFeature.geometry, 8) : [];

const file = `/** Auto-generated from geoBoundaries MAR ADM1 simplified (ODbL). Do not edit by hand. */
export const MOROCCO_MAP_VIEWBOX = { width: ${WIDTH}, height: ${HEIGHT} } as const;

export const MOROCCO_MAP_PROJECT = {
  minLon: ${minLon},
  maxLon: ${maxLon},
  minLat: ${minLat},
  maxLat: ${maxLat},
  width: ${WIDTH},
  height: ${HEIGHT},
  pad: ${PAD},
} as const;

export function projectMoroccoMap(lon: number, lat: number): { x: number; y: number } {
  const { minLon, maxLon, minLat, maxLat, width, height, pad } = MOROCCO_MAP_PROJECT;
  const x = pad + ((lon - minLon) / (maxLon - minLon)) * (width - pad * 2);
  const y = pad + ((maxLat - lat) / (maxLat - minLat)) * (height - pad * 2);
  return { x, y };
}

export const ORIENTAL_POLYGON_SAMPLE: [number, number][] = ${JSON.stringify(orientalSample)};

export type MoroccoRegionPath = {
  id: string;
  name: string;
  oriental: boolean;
  path: string;
};

export const MOROCCO_REGION_PATHS: MoroccoRegionPath[] = ${JSON.stringify(regions, null, 2)};

export const ORIENTAL_REGION_PATH = ${JSON.stringify(oriental?.path ?? "")};
`;

fs.writeFileSync(outPath, file);
console.log("Wrote", outPath, "regions:", regions.length);
