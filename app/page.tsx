export const dynamic = "force-dynamic";

// Server component shell to avoid prerendering issues when the whole page is a Client Component.
import React from "react";
import HomeClient from "@/components/HomeClient";

export default function HomePage() {
	return <HomeClient />;
}

