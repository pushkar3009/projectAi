import { currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";

export const checkUser = async () => {
  const user = await currentUser();

  if (!user) return null;

  try {
    const loggedInUser = await db.user.findUnique({
      where: {
        clerkUserId: user.id,
      },
    });

    if (loggedInUser) {
      return loggedInUser;
    }

    const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
    const defaultIndustry = "Not Specified";

    // ✅ Check if the industry already exists
    const existingIndustry = await db.industryInsight.findUnique({
      where: { industry: defaultIndustry },
    });

    // ✅ If not, create it
    if (!existingIndustry) {
      await db.industryInsight.create({
        data: {
          industry: defaultIndustry,
          salaryRanges: [],
          growthRate: 0,
          demandLevel: "Unknown",
          topSkills: [],
          marketOutlook: "N/A",
          keyTrends: [],
          recommendedSkills: [],
          nextUpdate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
        },
      });
    }

    // ✅ Now create the user
    const newUser = await db.user.create({
      data: {
        clerkUserId: user.id,
        name,
        imageUrl: user.imageUrl,
        email: user.emailAddresses[0].emailAddress,
        industry: defaultIndustry,
      },
    });

    return newUser;
  } catch (error) {
    console.error("User creation error:", error.message);
    return null;
  }
};
