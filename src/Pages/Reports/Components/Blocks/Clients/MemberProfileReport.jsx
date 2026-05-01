import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User, Phone, Mail, MapPin, Calendar, Building2, UserCheck,
  PiggyBank, CreditCard, Star, Users, Search, Banknote,
  ArrowUpFromLine, AlertCircle, ChevronRight, ArrowLeft,
  TrendingDown, TrendingUp, X,
} from "lucide-react";

/* ─── helpers ─────────────────────────────────────────────────────────────── */
const fmt   = (n) => new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(n ?? 0);
const money = (n) => `UGX ${fmt(n)}`;

const chipColor = (s) => {
  const v = (s ?? "").toLowerCase();
  if (["active","disbursed","delivered","present"].includes(v))
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
  if (["inactive","suspended","absent","failed"].includes(v))
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  if (["paid_off","settled","paid"].includes(v))
    return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
  if (["overdue","defaulted","late","partial"].includes(v))
    return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
  return "bg-muted text-muted-foreground";
};

const Chip = ({ label }) => (
  <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium capitalize ${chipColor(label)}`}>
    {label}
  </span>
);

const InfoRow = ({ icon: Icon, label, value }) =>
  value ? (
    <div className="flex items-start gap-2.5">
      <Icon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
      <span className="text-xs text-muted-foreground w-24 shrink-0">{label}</span>
      <span className="text-xs font-medium">{value}</span>
    </div>
  ) : null;

const StatCard = ({ icon: Icon, label, value, sub, cls }) => (
  <Card>
    <CardContent className="pt-4 pb-4 px-4">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${cls}`}><Icon className="w-4 h-4" /></div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-base font-bold leading-tight mt-0.5">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </div>
    </CardContent>
  </Card>
);

const EmptyRow = ({ cols, text = "No records found" }) => (
  <TableRow>
    <TableCell colSpan={cols} className="text-center py-8 text-sm text-muted-foreground">{text}</TableCell>
  </TableRow>
);

/* ─── Main component ─────────────────────────────────────────────────────── */
const MemberProfileReport = () => {
  const axiosPrivate  = useAxiosPrivate();
  const searchInputRef = useRef(null);

  const [inputVal,      setInputVal]      = useState("");
  const [searchTerm,    setSearchTerm]    = useState("");    // triggers search query
  const [selectedId,    setSelectedId]    = useState(null);  // triggers profile query

  // ── Search query (returns list of matches) ────────────────────────────────
  const {
    data:      searchData,
    isLoading: isSearching,
    isError:   searchError,
  } = useQuery({
    queryKey: ["member-search", searchTerm],
    enabled:  !!searchTerm && !selectedId,
    queryFn:  async () => {
      const res = await axiosPrivate.get("/reports/clients/member-profile", {
        params: { search: searchTerm },
      });
      return res?.data?.data ?? {};
    },
  });

  const searchResults = searchData?.search_results ?? [];

  // ── Profile query (full profile for selected client) ──────────────────────
  const {
    data:      profileData,
    isLoading: isLoadingProfile,
    isError:   profileError,
  } = useQuery({
    queryKey: ["member-profile", selectedId],
    enabled:  !!selectedId,
    queryFn:  async () => {
      const res = await axiosPrivate.get("/reports/clients/member-profile", {
        params: { client_id: selectedId },
      });
      return res?.data?.data ?? {};
    },
  });

  const handleSearch = (e) => {
    e.preventDefault();
    const term = inputVal.trim();
    if (!term) return;
    setSelectedId(null);
    setSearchTerm(term);
  };

  const handleSelectClient = (clientId) => {
    setSelectedId(clientId);
  };

  const handleBack = () => {
    setSelectedId(null);
  };

  const handleClear = () => {
    setInputVal("");
    setSearchTerm("");
    setSelectedId(null);
    searchInputRef.current?.focus();
  };

  const p = profileData?.profile  ?? {};
  const s = profileData?.summary  ?? {};
  const hasProfile = !!profileData?.profile;

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink to="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink to="/client-reports">Client Reports</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Member Profile</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-5 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h5 className="text-2xl font-bold tracking-tight">Member Profile Report</h5>
            <p className="text-sm text-muted-foreground mt-0.5">
              Full financial snapshot — loans, savings, shares, transactions & groups
            </p>
          </div>
          {selectedId && (
            <Button size="sm" variant="outline" onClick={handleBack} className="h-8">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to results
            </Button>
          )}
        </div>

        {/* ── Search bar ──────────────────────────────────────────────────────── */}
        <Card>
          <CardContent className="pt-4 pb-4 px-4">
            <form onSubmit={handleSearch} className="flex gap-2 max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  className="pl-9 pr-9 h-10 text-sm"
                  placeholder="Search by name, account number, phone, or ID number…"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                />
                {inputVal && (
                  <button type="button" onClick={handleClear}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <Button className="h-10 px-5" type="submit" disabled={isSearching || !inputVal.trim()}>
                {isSearching ? <RefreshCwIcon /> : <Search className="w-4 h-4 mr-1.5" />}
                {isSearching ? "Searching…" : "Search"}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-2">
              Supports partial name, full account number (e.g. ACC-001), phone number, or national ID.
            </p>
          </CardContent>
        </Card>

        {/* ── Loading states ───────────────────────────────────────────────────── */}
        {(isSearching || isLoadingProfile) && (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-2/3 rounded-xl" />
          </div>
        )}

        {/* ── Error states ─────────────────────────────────────────────────────── */}
        {(searchError || profileError) && !isSearching && !isLoadingProfile && (
          <Card className="border-destructive/30">
            <CardContent className="flex items-center gap-3 pt-4 pb-4">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
              <span className="text-sm text-destructive">
                Member not found. Check the details and try again.
              </span>
            </CardContent>
          </Card>
        )}

        {/* ── Search results list ──────────────────────────────────────────────── */}
        {!selectedId && !isSearching && searchResults.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground px-1">
              {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for &ldquo;{searchTerm}&rdquo;
            </p>
            {searchResults.map((c) => (
              <Card key={c.client_id}
                className="cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all group"
                onClick={() => handleSelectClient(c.client_id)}>
                <CardContent className="flex items-center gap-4 py-3 px-4">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold capitalize">{c.name}</span>
                      <Chip label={c.status} />
                      <span className="text-xs bg-muted px-1.5 py-0.5 rounded capitalize">{c.type}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                      <span className="font-mono">{c.account}</span>
                      {c.contact && <span><Phone className="w-3 h-3 inline mr-0.5" />{c.contact}</span>}
                      {c.branch  && <span><Building2 className="w-3 h-3 inline mr-0.5" />{c.branch}</span>}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!selectedId && !isSearching && searchTerm && searchResults.length === 0 && !searchError && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <Search className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">No members found for &ldquo;{searchTerm}&rdquo;</p>
              <p className="text-xs text-muted-foreground mt-1">Try a different name, account number, or phone number.</p>
            </CardContent>
          </Card>
        )}

        {/* ── Full Profile ─────────────────────────────────────────────────────── */}
        {hasProfile && !isLoadingProfile && (
          <div className="space-y-5">

            {/* Identity card */}
            <Card>
              <CardContent className="pt-5 pb-5 px-5">
                <div className="flex flex-col sm:flex-row gap-5">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h2 className="text-xl font-bold capitalize">{p.name}</h2>
                      <Chip label={p.status} />
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">{p.type}</span>
                    </div>
                    <p className="text-sm font-mono text-muted-foreground mb-3">{p.account}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-10">
                      <InfoRow icon={Phone}     label="Contact"    value={p.contact} />
                      <InfoRow icon={Mail}      label="Email"      value={p.email} />
                      <InfoRow icon={Calendar}  label="Joined"     value={p.join_date} />
                      <InfoRow icon={Calendar}  label="Date of Birth" value={p.dob} />
                      <InfoRow icon={Building2} label="Branch"     value={p.branch} />
                      <InfoRow icon={UserCheck} label="Officer"    value={p.officer?.trim()} />
                      <InfoRow icon={MapPin}    label="Address"    value={p.address} />
                      <InfoRow icon={User}      label="Gender"     value={p.gender} />
                      <InfoRow icon={User}      label="ID Number"  value={p.id_number} />
                    </div>
                  </div>
                  <div className="shrink-0 self-start">
                    <Link to={`/clients/${p.type === "group" ? "group" : "individual"}/${p.client_id}`}>
                      <Button size="sm" variant="outline" className="h-8 text-xs">
                        Open Full Profile
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard icon={PiggyBank}    label="Total Savings"   value={money(s.total_savings)}
                sub={`Deposits: ${money(s.total_deposited)}`}
                cls="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30" />
              <StatCard icon={TrendingDown} label="Loans"           value={s.total_loans ?? 0}
                sub={`${s.active_loans ?? 0} active`}
                cls="bg-blue-100 text-blue-600 dark:bg-blue-900/30" />
              <StatCard icon={AlertCircle}  label="Outstanding"     value={money(s.total_outstanding)}
                sub={`Disbursed: ${money(s.total_disbursed)}`}
                cls="bg-orange-100 text-orange-600 dark:bg-orange-900/30" />
              <StatCard icon={Star}         label="Shares"          value={`${fmt(s.shares)} units`}
                sub="current balance"
                cls="bg-violet-100 text-violet-600 dark:bg-violet-900/30" />
            </div>

            {/* Second row stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <StatCard icon={Banknote}        label="Total Deposited"  value={money(s.total_deposited)}
                sub={`Withdrawn: ${money(s.total_withdrawn)}`}
                cls="bg-teal-100 text-teal-600 dark:bg-teal-900/30" />
              <StatCard icon={ArrowUpFromLine} label="Net Savings"      value={money(s.net_savings)}
                sub="deposits − withdrawals"
                cls="bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30" />
              <StatCard icon={TrendingUp}      label="Loan Disbursed"   value={money(s.total_disbursed)}
                sub={`${s.total_loans} loan(s) total`}
                cls="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30" />
            </div>

            {/* Tabs */}
            <Tabs defaultValue="accounts">
              <TabsList className="h-9 flex-wrap gap-1">
                <TabsTrigger value="accounts"    className="text-xs">Savings Accounts ({profileData?.accounts?.length ?? 0})</TabsTrigger>
                <TabsTrigger value="loans"       className="text-xs">Loans ({profileData?.loans?.length ?? 0})</TabsTrigger>
                <TabsTrigger value="deposits"    className="text-xs">Deposits</TabsTrigger>
                <TabsTrigger value="withdrawals" className="text-xs">Withdrawals</TabsTrigger>
                <TabsTrigger value="shares"      className="text-xs">Shares</TabsTrigger>
                {profileData?.groups?.length > 0 && (
                  <TabsTrigger value="groups" className="text-xs">Groups ({profileData.groups.length})</TabsTrigger>
                )}
              </TabsList>

              {/* Savings Accounts */}
              <TabsContent value="accounts">
                <Card><CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <PiggyBank className="w-4 h-4 text-emerald-600" /> Savings Accounts
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Product / Account Type</TableHead>
                          <TableHead className="text-xs text-right">Balance</TableHead>
                          <TableHead className="text-xs text-right">Frozen</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {profileData?.accounts?.length ? profileData.accounts.map((a) => (
                          <TableRow key={a.account_id}>
                            <TableCell className="text-xs font-medium">{a.product}</TableCell>
                            <TableCell className="text-xs text-right font-mono text-emerald-600">{money(a.balance)}</TableCell>
                            <TableCell className="text-xs text-right font-mono text-amber-600">{money(a.frozen)}</TableCell>
                            <TableCell><Chip label={a.status} /></TableCell>
                          </TableRow>
                        )) : <EmptyRow cols={4} text="No savings accounts" />}
                        {profileData?.accounts?.length > 0 && (
                          <TableRow className="font-semibold bg-muted/30 text-xs">
                            <TableCell>Total</TableCell>
                            <TableCell className="text-right font-mono text-emerald-700">
                              {money(profileData.accounts.reduce((s, a) => s + a.balance, 0))}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {money(profileData.accounts.reduce((s, a) => s + a.frozen, 0))}
                            </TableCell>
                            <TableCell />
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Loans */}
              <TabsContent value="loans">
                <Card>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-blue-600" /> Loan History
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Loan #</TableHead>
                          <TableHead className="text-xs">Product</TableHead>
                          <TableHead className="text-xs text-right">Applied</TableHead>
                          <TableHead className="text-xs text-right">Disbursed</TableHead>
                          <TableHead className="text-xs text-right">Outstanding</TableHead>
                          <TableHead className="text-xs">Tenure</TableHead>
                          <TableHead className="text-xs">Date</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {profileData?.loans?.length ? profileData.loans.map((l) => (
                          <TableRow key={l.loan_id}>
                            <TableCell className="text-xs">
                              <Link to={`/loans/${l.loan_id}`} className="font-mono text-primary hover:underline">{l.code}</Link>
                            </TableCell>
                            <TableCell className="text-xs">{l.product}</TableCell>
                            <TableCell className="text-xs text-right font-mono">{fmt(l.amount)}</TableCell>
                            <TableCell className="text-xs text-right font-mono">{fmt(l.disbursed)}</TableCell>
                            <TableCell className="text-xs text-right font-mono text-orange-600 font-semibold">{fmt(l.outstanding)}</TableCell>
                            <TableCell className="text-xs">{l.tenure} mo.</TableCell>
                            <TableCell className="text-xs">{l.date}</TableCell>
                            <TableCell><Chip label={l.status} /></TableCell>
                          </TableRow>
                        )) : <EmptyRow cols={8} text="No loan history" />}
                        {profileData?.loans?.length > 0 && (
                          <TableRow className="font-semibold bg-muted/30 text-xs">
                            <TableCell colSpan={2}>Totals ({profileData.loans.length})</TableCell>
                            <TableCell className="text-right font-mono">{fmt(profileData.loans.reduce((s,l)=>s+l.amount,0))}</TableCell>
                            <TableCell className="text-right font-mono">{fmt(profileData.loans.reduce((s,l)=>s+l.disbursed,0))}</TableCell>
                            <TableCell className="text-right font-mono text-orange-600">{fmt(profileData.loans.reduce((s,l)=>s+l.outstanding,0))}</TableCell>
                            <TableCell colSpan={3} />
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Deposits */}
              <TabsContent value="deposits">
                <Card>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-emerald-600" /> Recent Deposits
                      <span className="text-xs font-normal text-muted-foreground">(last 20)</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="flex items-center gap-4 mb-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                      <span className="text-xs text-muted-foreground">Total Deposited (lifetime)</span>
                      <span className="text-sm font-bold text-emerald-700">{money(s.total_deposited)}</span>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Code</TableHead>
                          <TableHead className="text-xs text-right">Amount</TableHead>
                          <TableHead className="text-xs">Method</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                          <TableHead className="text-xs">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {profileData?.deposits?.length ? profileData.deposits.map((d) => (
                          <TableRow key={d.id}>
                            <TableCell className="text-xs font-mono">{d.code}</TableCell>
                            <TableCell className="text-xs text-right font-mono">{fmt(d.amount)}</TableCell>
                            <TableCell><Badge variant="outline" className="text-xs capitalize">{d.method}</Badge></TableCell>
                            <TableCell><Chip label={d.status} /></TableCell>
                            <TableCell className="text-xs">{d.date}</TableCell>
                          </TableRow>
                        )) : <EmptyRow cols={5} text="No deposit transactions" />}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Withdrawals */}
              <TabsContent value="withdrawals">
                <Card>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ArrowUpFromLine className="w-4 h-4 text-amber-600" /> Recent Withdrawals
                      <span className="text-xs font-normal text-muted-foreground">(last 20)</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="flex items-center gap-4 mb-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                      <span className="text-xs text-muted-foreground">Total Withdrawn (lifetime)</span>
                      <span className="text-sm font-bold text-amber-700">{money(s.total_withdrawn)}</span>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Code</TableHead>
                          <TableHead className="text-xs text-right">Amount</TableHead>
                          <TableHead className="text-xs">Method</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                          <TableHead className="text-xs">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {profileData?.withdrawals?.length ? profileData.withdrawals.map((w) => (
                          <TableRow key={w.id}>
                            <TableCell className="text-xs font-mono">{w.code}</TableCell>
                            <TableCell className="text-xs text-right font-mono">{fmt(w.amount)}</TableCell>
                            <TableCell><Badge variant="outline" className="text-xs capitalize">{w.method}</Badge></TableCell>
                            <TableCell><Chip label={w.status} /></TableCell>
                            <TableCell className="text-xs">{w.date}</TableCell>
                          </TableRow>
                        )) : <EmptyRow cols={5} text="No withdrawal transactions" />}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Shares */}
              <TabsContent value="shares">
                <Card>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Star className="w-4 h-4 text-violet-600" /> Share Transactions
                      <span className="text-xs font-normal text-muted-foreground">(last 20)</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="flex items-center gap-4 mb-3 p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20">
                      <span className="text-xs text-muted-foreground">Current Share Balance</span>
                      <span className="text-sm font-bold text-violet-700">{fmt(s.shares)} units</span>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Code</TableHead>
                          <TableHead className="text-xs text-right">Units</TableHead>
                          <TableHead className="text-xs">Type</TableHead>
                          <TableHead className="text-xs">Note</TableHead>
                          <TableHead className="text-xs">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {profileData?.shares_txns?.length ? profileData.shares_txns.map((st) => (
                          <TableRow key={st.id}>
                            <TableCell className="text-xs font-mono">{st.code}</TableCell>
                            <TableCell className="text-xs text-right font-mono">{fmt(st.count)}</TableCell>
                            <TableCell><Badge variant="outline" className="text-xs">{st.type}</Badge></TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{st.note}</TableCell>
                            <TableCell className="text-xs">{st.date}</TableCell>
                          </TableRow>
                        )) : <EmptyRow cols={5} text="No share transactions" />}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Groups */}
              {profileData?.groups?.length > 0 && (
                <TabsContent value="groups">
                  <Card>
                    <CardHeader className="pb-2 pt-4 px-4">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600" /> Group Memberships
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Group Name</TableHead>
                            <TableHead className="text-xs">Status</TableHead>
                            <TableHead className="text-xs" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {profileData.groups.map((g) => (
                            <TableRow key={g.group_id}>
                              <TableCell className="text-xs font-medium capitalize">{g.group_name}</TableCell>
                              <TableCell><Chip label={g.status} /></TableCell>
                              <TableCell>
                                <Link to={`/clients/group/${g.group_id}`}>
                                  <Button size="sm" variant="ghost" className="h-7 text-xs">View Group</Button>
                                </Link>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>
        )}

        {/* Empty state — before any search */}
        {!searchTerm && !selectedId && !isSearching && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-muted/60 flex items-center justify-center mb-5">
              <Search className="w-9 h-9 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold mb-1">Search for a Member</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Enter a member&apos;s name, account number, phone number, or national ID to view their
              complete financial profile — savings, loans, shares, transactions, and group memberships.
            </p>
          </div>
        )}
      </div>
    </>
  );
};

/* tiny inline spinner icon to avoid extra import */
const RefreshCwIcon = () => (
  <svg className="w-4 h-4 mr-1.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

export default MemberProfileReport;
