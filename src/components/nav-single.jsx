/* eslint-disable react/prop-types */
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {Link} from "react-router-dom"
export function NavSingle({
  data
}) {

  return (
    (<SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>{data.title}</SidebarGroupLabel>
      <SidebarMenu>
        {data.items.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild>
              <Link to={item.url}>
                <item.icon />
                <span>{item.name}</span>
              </Link>
            </SidebarMenuButton>

          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>)
  );
}
