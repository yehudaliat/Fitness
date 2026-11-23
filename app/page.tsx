import { existsSync } from "node:fs";
import path from "node:path";
import Landing from "./components/Landing";

// נבדק בזמן ה-build: אם יש public/example.mp4 מציגים נגן, ואם יש example-poster.jpg משתמשים בו כתמונת פתיחה.
const pub = (f: string) => existsSync(path.join(process.cwd(), "public", f));

export default function Page() {
  return (
    <Landing
      hasExample={pub("example.mp4")}
      poster={pub("example-poster.jpg") ? "/example-poster.jpg" : undefined}
    />
  );
}
