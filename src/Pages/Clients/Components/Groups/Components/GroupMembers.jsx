import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users,
  UserPlus,
  Trash2,
  Search,
  X,
  Shield,
  CheckCircle2,
  Wallet,
  Plus,
  CheckCheck,
} from "lucide-react";

const MEMBER_ROLES = [
  { value: "regular_member",   label: "Regular Member" },
  { value: "chairperson",      label: "Chairperson" },
  { value: "vice_chairperson", label: "Vice Chairperson" },
  { value: "secretary",        label: "Secretary" },
  { value: "treasurer",        label: "Treasurer" },
  { value: "patron",           label: "Patron" },
  { value: "other",            label: "Other Officer" },
];

const ROLE_BADGE = {
  chairperson:      "bg-blue-100 text-blue-800 border-blue-200",
  vice_chairperson: "bg-blue-50 text-blue-700 border-blue-100",
  secretary:        "bg-green-100 text-green-800 border-green-200",
  treasurer:        "bg-orange-100 text-orange-800 border-orange-200",
  patron:           "bg-purple-100 text-purple-800 border-purple-200",
  other:            "bg-gray-100 text-gray-700 border-gray-200",
  regular_member:   "bg-slate-100 text-slate-600 border-slate-200",
};

const roleLabel = (value) =>
  MEMBER_ROLES.find((r) => r.value === value)?.label ?? value?.replace(/_/g, " ") ?? "—";

const RoleBadge = ({ role }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${
      ROLE_BADGE[role] ?? ROLE_BADGE.regular_member
    }`}
  >
    {roleLabel(role)}
  </span>
);

const fmt = (v) =>
  Number(v ?? 0).toLocaleString("en-UG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── Member Savings Dialog ──────────────────────────────────────────────────────
const MemberSavingsDialog = ({ member, clientId, groupId }) => {
  const axiosPrivate = useAxiosPrivate();
  const queryClient  = useQueryClient();
  const [open, setOpen] = useState(false);

  const memberId   = clientId ?? member?.client_id;
  const memberName = `${member?.client_firstname ?? ""} ${member?.client_lastname ?? ""}`.trim();

  // Group's savings accounts (the parent accounts)
  const { data: groupAccounts = [], isLoading: loadingGroup } = useQuery({
    queryKey: ["group-accounts", groupId],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/accounts/attached/accounts?clientid=${groupId}`);
      return res.data.data?.accounts ?? [];
    },
    enabled: open && !!groupId,
  });

  // This member's existing sub-accounts linked under this group
  const { data: memberSavings = [], isLoading: loadingMember, refetch: refetchMember } = useQuery({
    queryKey: ["group-member-savings-member", groupId, memberId],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/clients/groups/${groupId}/member-savings`);
      const all = res.data.data?.members ?? [];
      return all.filter((r) => r.member_id === memberId);
    },
    enabled: open && !!groupId && !!memberId,
  });

  const linkedProductIds = memberSavings.map((s) => s.savings_product_id);
  const missingAccounts  = groupAccounts.filter(
    (a) => !linkedProductIds.includes(a.savings_product_id)
  );

  const addSubAccount = useMutation({
    mutationFn: (savingsProductId) =>
      axiosPrivate.post(`/clients/groups/${groupId}/member-savings`, {
        member_id:          memberId,
        savings_product_id: savingsProductId,
      }),
    onSuccess: () => {
      refetchMember();
      queryClient.invalidateQueries({ queryKey: ["group-member-savings", groupId] });
      toast({ title: "Sub-account linked successfully" });
    },
    onError: (err) => {
      toast({
        title: "Error",
        variant: "destructive",
        description: err?.response?.data?.messages?.[0] ?? "Failed to create sub-account",
      });
    },
  });

  const isLoading = loadingGroup || loadingMember;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="xs" variant="outline" className="h-7 px-2 text-xs gap-1">
          <Wallet className="w-3.5 h-3.5" />
          Savings
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-blue-500" />
            Sub-Accounts — {memberName}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : groupAccounts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            This group has no savings accounts yet. Add a group account first.
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Showing the group&apos;s savings products. Each member should have a sub-account under each one.
            </p>
            <div className="border rounded-lg divide-y">
              {groupAccounts.map((groupAcc) => {
                const linked = memberSavings.find(
                  (s) => s.savings_product_id === groupAcc.savings_product_id
                );
                const hasIt = !!linked;

                return (
                  <div
                    key={groupAcc.savings_product_id}
                    className="flex items-center justify-between px-3 py-3"
                  >
                    <div className="flex items-center gap-2.5">
                      {hasIt ? (
                        <CheckCheck className="w-4 h-4 text-green-500 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{groupAcc.product_title}</p>
                        {hasIt && (
                          <p className="text-xs text-muted-foreground">
                            Balance: UGX {fmt(linked.actual_balance)} &nbsp;·&nbsp;
                            Available: UGX {fmt(linked.available_balance)}
                          </p>
                        )}
                        {!hasIt && (
                          <p className="text-xs text-orange-500">No sub-account yet</p>
                        )}
                      </div>
                    </div>

                    {hasIt ? (
                      <Badge variant="default" className="text-xs">Active</Badge>
                    ) : (
                      <Button
                        size="xs"
                        className="h-7 px-2 text-xs"
                        disabled={addSubAccount.isPending}
                        onClick={() => addSubAccount.mutate(groupAcc.savings_product_id)}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// ── Main GroupMembers Component ───────────────────────────────────────────────
const GroupMembers = () => {
  const axiosPrivate = useAxiosPrivate();
  const params = useParams();
  const queryClient = useQueryClient();
  const groupId = params.id;

  const [addOpen, setAddOpen]             = useState(false);
  const [searchTerm, setSearchTerm]       = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching]     = useState(false);
  const [selected, setSelected]           = useState(null);
  const [selectedRole, setSelectedRole]   = useState("regular_member");
  const [editingRole, setEditingRole]     = useState({});

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["group-members", groupId],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/clients/groups/${groupId}/attaches`);
      return res.data.data.members ?? [];
    },
  });

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setIsSearching(true);
    setSelected(null);
    setSelectedRole("regular_member");
    try {
      const res = await axiosPrivate.get(
        `/clients/individual?search=${encodeURIComponent(searchTerm)}`
      );
      setSearchResults(res.data.data?.clients ?? []);
    } catch {
      toast({ title: "Search failed", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (client) => {
    setSelected(client);
    setSearchResults([]);
    setSearchTerm(`${client.client_firstname} ${client.client_lastname}`);
  };

  const handleClearSelection = () => {
    setSelected(null);
    setSearchTerm("");
    setSearchResults([]);
    setSelectedRole("regular_member");
  };

  const addMember = useMutation({
    mutationFn: () =>
      axiosPrivate.post("/clients/groups/attaches", {
        group_id:    parseInt(groupId),
        member_id:   selected.client_id,
        member_role: selectedRole,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-members", groupId] });
      toast({ title: "Member added to group" });
      setAddOpen(false);
      handleClearSelection();
    },
    onError: (err) => {
      toast({
        title: "Error",
        variant: "destructive",
        description: err?.response?.data?.messages?.[0] ?? "Failed to add member",
      });
    },
  });

  const removeMember = useMutation({
    mutationFn: (attachId) =>
      axiosPrivate.delete(`/clients/groups/attaches/${attachId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-members", groupId] });
      toast({ title: "Member removed" });
    },
    onError: () => {
      toast({ title: "Error removing member", variant: "destructive" });
    },
  });

  const updateRole = useMutation({
    mutationFn: ({ attachId, role }) =>
      axiosPrivate.patch(`/clients/groups/attaches/${attachId}`, {
        member_role: role,
      }),
    onSuccess: (_, { attachId }) => {
      queryClient.invalidateQueries({ queryKey: ["group-members", groupId] });
      setEditingRole((prev) => { const n = { ...prev }; delete n[attachId]; return n; });
      toast({ title: "Role updated" });
    },
    onError: () => {
      toast({ title: "Failed to update role", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  const alreadyMemberIds = members.map((m) => m.member?.client_id);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-500" />
          <span className="font-semibold text-sm">
            {members.length} Member{members.length !== 1 ? "s" : ""}
          </span>
        </div>

        <Dialog
          open={addOpen}
          onOpenChange={(v) => {
            setAddOpen(v);
            if (!v) handleClearSelection();
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm">
              <UserPlus className="w-4 h-4 mr-2" /> Add Member
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Member to Group</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Search Individual Client</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      placeholder="Name, account no., or contact…"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        if (selected) setSelected(null);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && !selected && handleSearch()}
                      readOnly={!!selected}
                      className={selected ? "pr-8 bg-muted" : ""}
                    />
                    {selected && (
                      <button
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={handleClearSelection}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {!selected && (
                    <Button size="sm" onClick={handleSearch} disabled={isSearching}>
                      <Search className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {selected && (
                <div className="border rounded-lg p-3 bg-blue-50 border-blue-200 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">
                      {selected.client_firstname} {selected.client_lastname}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selected.client_account_number} · {selected.client_contact}
                    </p>
                  </div>
                </div>
              )}

              {!selected && searchResults.length > 0 && (
                <div className="border rounded-md divide-y max-h-52 overflow-y-auto">
                  {searchResults.map((c) => {
                    const alreadyIn = alreadyMemberIds.includes(c.client_id);
                    return (
                      <button
                        key={c.client_id}
                        disabled={alreadyIn}
                        onClick={() => !alreadyIn && handleSelect(c)}
                        className={`w-full flex items-center justify-between p-3 text-left text-sm transition-colors ${
                          alreadyIn
                            ? "opacity-40 cursor-not-allowed"
                            : "hover:bg-accent cursor-pointer"
                        }`}
                      >
                        <div>
                          <p className="font-medium">
                            {c.client_firstname} {c.client_lastname}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {c.client_account_number} · {c.client_contact}
                          </p>
                        </div>
                        {alreadyIn && (
                          <Badge variant="secondary" className="text-xs">
                            Already added
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {!selected && searchResults.length === 0 && searchTerm && !isSearching && (
                <p className="text-muted-foreground text-sm text-center py-3">
                  No individual clients found.
                </p>
              )}

              {selected && (
                <div className="space-y-1">
                  <Label>Member Role</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MEMBER_ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button
                className="w-full"
                disabled={!selected || addMember.isPending}
                onClick={() => addMember.mutate()}
              >
                {addMember.isPending ? "Adding…" : "Add Member"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Empty state */}
      {members.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No members in this group yet.</p>
          <p className="text-xs mt-1">Use "Add Member" to attach individual clients.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Account No.</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m, idx) => {
              const memberId  = m.member?.client_id;
              const isOfficer = m.source === "executive";
              const attachId  = m.id;
              const currentRole = editingRole[attachId] ?? m.member_role ?? "regular_member";

              return (
                <TableRow key={memberId ?? idx}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-1.5">
                      {isOfficer && (
                        <Shield className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      )}
                      {m.member?.client_firstname} {m.member?.client_lastname}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {m.member?.client_account_number}
                  </TableCell>
                  <TableCell>{m.member?.client_contact}</TableCell>

                  <TableCell>
                    {isOfficer ? (
                      <RoleBadge role={m.member_role} />
                    ) : (
                      <div className="flex items-center gap-1">
                        <Select
                          value={currentRole}
                          onValueChange={(val) =>
                            setEditingRole((prev) => ({ ...prev, [attachId]: val }))
                          }
                        >
                          <SelectTrigger className="h-7 text-xs w-36 px-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MEMBER_ROLES.map((r) => (
                              <SelectItem key={r.value} value={r.value} className="text-xs">
                                {r.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {editingRole[attachId] && editingRole[attachId] !== m.member_role && (
                          <Button
                            size="xs"
                            className="h-7 px-2 text-xs"
                            disabled={updateRole.isPending}
                            onClick={() =>
                              updateRole.mutate({ attachId, role: editingRole[attachId] })
                            }
                          >
                            Save
                          </Button>
                        )}
                      </div>
                    )}
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={m.status === "active" ? "default" : "secondary"}
                      className="capitalize text-xs"
                    >
                      {m.status ?? "active"}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Member Savings sub-accounts */}
                      <MemberSavingsDialog member={m.member} clientId={m.client_id} groupId={groupId} />

                      {!isOfficer ? (
                        <Button
                          size="xs"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => removeMember.mutate(attachId)}
                          disabled={removeMember.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground pr-2">Officer</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default GroupMembers;
