import { getCurrentUser } from "@/lib/auth/get-user";
import { redirect } from "next/navigation";
import { LearningPage } from "@/components/learning/learning-page";

export default async function AmbassadorLearningPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <LearningPage user={user} />;
}
