import { createRootRoute, Outlet } from "@tanstack/react-router";
import { RealtimeBridge } from "@/components/realtime/RealtimeBridge";

export const Route = createRootRoute({
  component: () => (
    <>
      <RealtimeBridge />
      <Outlet />
    </>
  ),
});