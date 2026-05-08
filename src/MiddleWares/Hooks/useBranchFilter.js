import useAuth from "./useAuth";

/**
 * Returns branch-aware query key fragment and API params.
 * When the user has selected a specific branch in the sidebar switcher,
 * `branchKey` is that branch_id (used in React Query keys to trigger refetch)
 * and `branchParams` has `{ branchId }` to pass as query params to the API.
 * When "All Branches" is selected, both are null/empty so the API returns sacco-level data.
 */
export default function useBranchFilter() {
  const { auth } = useAuth();
  const branchId = auth?.current_branch_id ?? null;

  return {
    branchKey: branchId,
    branchParams: branchId != null ? { branchId } : {},
  };
}
