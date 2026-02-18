import { redirect } from "next/navigation";

export default function Home() {
  redirect("/login"); // or "/login" if that’s your route
}
