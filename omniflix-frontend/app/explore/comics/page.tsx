import { redirect } from "next/navigation";

const instant = true

export default function ComicsIndexPage() {
    redirect("/explore/comics/asura-scans");
}
