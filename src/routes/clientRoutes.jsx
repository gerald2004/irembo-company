import Clients from "@/Pages/Clients/Clients";
import SingleIndividualClient from "@/Pages/Clients/Components/Individuals/SingleIndividualClient";
import SingleGroupClient from "@/Pages/Clients/Components/Groups/SingleGroupClient";
import AccountsSummary from "@/Pages/Clients/Components/Individuals/AccountsSummary";
import AccountsSummaryGroup from "@/Pages/Clients/Components/Groups/AccountsSummaryGroup";
import AddNewMember from "@/Pages/Clients/Components/Individuals/AddNewMember";
import AddNewGroup from "@/Pages/Clients/Components/Groups/AddGroup";
import EditMember from "@/Pages/Clients/Components/Individuals/EditMember";
import EditGroup from "@/Pages/Clients/Components/Groups/EditGroup";
import AddCompany from "@/Pages/Clients/Components/Company/AddCompany";
import SingleCompanyClient from "@/Pages/Clients/Components/Company/SingleCompanyClient";
import EditCompany from "@/Pages/Clients/Components/Company/EditCompany";
import AddJointAccount from "@/Pages/Clients/Components/JointAccounts/AddJointAccount";
import SingleJointAccountClient from "@/Pages/Clients/Components/JointAccounts/SingleJointAccountClient";
import EditJointAccount from "@/Pages/Clients/Components/JointAccounts/EditJointAccount";

const clientsRoutes = [
  {
    path: "/clients",
    element: <Clients />,
    roles: [100011, 100015],
  },
  {
    path: "/clients/individual/:id",
    element: <SingleIndividualClient />,
    roles: [100008],
  },
  {
    path: "/clients/group/:id",
    element: <SingleGroupClient />,
    roles: [100016],
  },
  {
    path: "/clients/individuals/:id/accounts/:client_id",
    element: <AccountsSummary />,
    roles: [100155],
  },
  {
    path: "/clients/group/:id/accounts/:client_id",
    element: <AccountsSummaryGroup />,
    roles: [100155],
  },
  {
    path: "/clients/individual/new",
    element: <AddNewMember />,
    roles: [100007],
  },
  {
    path: "/clients/group/new",
    element: <AddNewGroup />,
    roles: [100012],
  },
  {
    path: "/clients/individual/:id/edit-client",
    element: <EditMember />,
    roles: [100009],
  },
  {
    path: "/clients/group/:id/edit-client",
    element: <EditGroup />,
    roles: [100013],
  },
  {
    path: "/clients/company/:id",
    element: <SingleCompanyClient />,
    roles: [100008],
  },
  {
    path: "/clients/company/new",
    element: <AddCompany />,
    roles: [100012],
  },
  {
    path: "/clients/company/:id/edit-client",
    element: <EditCompany />,
    roles: [100009],
  },
  {
    path: "/clients/joint-account/:id",
    element: <SingleJointAccountClient />,
    roles: [100008],
  },
  {
    path: "/clients/joint-account/new",
    element: <AddJointAccount />,
    roles: [100012],
  },
  {
    path: "/clients/joint-account/:id/edit-client",
    element: <EditJointAccount />,
    roles: [100009],
  },
];

export default clientsRoutes;
