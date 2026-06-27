import { redirect } from "next/navigation";
import { ROUTES } from "@/src/constants/routes";

export default function HomePage() {
  redirect(ROUTES.LOGIN);
}
