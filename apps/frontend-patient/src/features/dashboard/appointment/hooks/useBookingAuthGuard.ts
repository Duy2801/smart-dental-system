import { useRouter } from "next/navigation";
import { apiMe, apiRefresh } from "@/features/auth/api";
import {
  login,
  updateAccessToken,
  useAppDispatch,
} from "@/providers";

type UseBookingAuthGuardParams = {
  isLoggedIn: boolean;
};

export function useBookingAuthGuard({
  isLoggedIn,
}: UseBookingAuthGuardParams) {
  const router = useRouter();
  const dispatch = useAppDispatch();

  async function ensureLoggedInBeforeBooking() {
    if (isLoggedIn) return true;

    try {
      const refreshResponse = await apiRefresh();
      const { accessToken: refreshedAccessToken } = refreshResponse.data;
      dispatch(updateAccessToken(refreshedAccessToken));
      const meResponse = await apiMe();

      dispatch(
        login({
          user: meResponse.data,
          accessToken: refreshedAccessToken,
        }),
      );

      return true;
    } catch {
      const redirectPath =
        typeof window === "undefined"
          ? "/appointment"
          : `${window.location.pathname}${window.location.search}`;

      router.push(`/auth/login?redirect=${encodeURIComponent(redirectPath)}`);
      return false;
    }
  }

  return {
    ensureLoggedInBeforeBooking,
  };
}
