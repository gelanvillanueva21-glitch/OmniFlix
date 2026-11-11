// Matches the other comics/novels segments: this page redirects and can never
// produce an instant static shell, so validation is opted out entirely.
export const instant = false;

import { redirect } from "next/navigation";

export default function ComicsIndexPage() {
    redirect("/explore/comics/asura-scans");
}
