import { useEffect, useState } from "react";
import useAuth from "./useAuth";

/**
 * Returns branch-aware query key fragment and API params.
 *
 * Reacts to the `branch-switched` custom event fired by TeamSwitcher so that
 * queries refetch immediately without waiting for a token refresh.
 *
 * branchKey  — value to include in React Query keys (null = all branches)
 * branchParams — { branchId } to send as query params (empty when all branches)
 */
export default function useBranchFilter() {
  const { auth } = useAuth();

  // Seed from auth context; the event handler keeps it in sync afterward.
  const [branchId, setBranchId] = useState(auth?.current_branch_id ?? null);

  useEffect(() => {
    const handler = (e) => {
      const id = e.detail?.branch_id ?? null;
      setBranchId(id ? Number(id) : null);
    };
    window.addEventListener("branch-switched", handler);
    return () => window.removeEventListener("branch-switched", handler);
  }, []);

  // If auth changes (e.g. page refresh / token refresh), re-sync.
  useEffect(() => {
    setBranchId(auth?.current_branch_id ?? null);
  }, [auth?.current_branch_id]);

  return {
    branchKey: branchId,
    branchParams: branchId != null ? { branchId } : {},
  };
}
