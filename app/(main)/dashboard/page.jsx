import { getIndustryInsights } from "@/actions/dashboard";
import { getUserOnboardingStatus } from "@/actions/user";
import { redirect } from "next/navigation";
import DashboardView from "./_components/dashboard-view";
import Layout from "./_components/layout"; // ✅ this must be used

export default async function IndustryInsightsPage() {
  const { isOnboarded } = await getUserOnboardingStatus();
  if (!isOnboarded) redirect("/onboarding");

  const insights = await getIndustryInsights();

  return (
    <Layout>
      <DashboardView insights={insights} />
    </Layout>
  );
}
