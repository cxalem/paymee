import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { LayoutDashboard, BarChart3, HelpCircle } from "lucide-react";
import Link from "next/link";
import { Login } from "./login";

const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "All PayMees",
    url: "/paymees",
    icon: BarChart3,
  },
  {
    title: "Support",
    url: "/support",
    icon: HelpCircle,
  },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="text-white text-xl font-bold">Platform</div>
      </SidebarHeader>
      <SidebarContent className="px-2 text-white/90">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="h-full">
              <div className="flex flex-col justify-between h-[calc(100vh-100px)] gap-2">
                <div>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Link
                          href={item.url}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          <item.icon className="h-5 w-5" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </div>
                <Login />
              </div>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
