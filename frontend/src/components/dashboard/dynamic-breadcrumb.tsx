"use client";

import React from "react";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useBreadcrumbStore } from "@/store/breadcrumb-store";
import { useForms } from "@/hooks/use-forms";

const routeLabels: Record<string, string> = {
  home: "Home",
  "my-forms": "My Forms",
  templates: "Templates",
  template: "Templates",
  profile: "Profile",
  "org-settings": "Org Settings",
  responses: "Responses",
  builder: "Builder",
};

const isUuid = (str: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export function DynamicBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const customTitles = useBreadcrumbStore((s) => s.titles);
  const { data: forms } = useForms();

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((segment, idx) => {
          const href = "/" + segments.slice(0, idx + 1).join("/");

          // Resolve label in priority order:
          // 1. Static route label (e.g. "responses" -> "Responses")
          // 2. Matched form from forms cache (e.g. "nice-change with a change")
          // 3. Custom title from store (if not generic)
          // 4. Clean slug (if not a UUID)
          // 5. Fallback without ever showing a raw UUID
          let label = routeLabels[segment.toLowerCase()];

          if (!label && forms) {
            const matched = forms.find(
              (f) =>
                f.id === segment ||
                f.slug === segment ||
                f.id.toLowerCase() === segment.toLowerCase(),
            );
            if (matched && matched.title) {
              label = matched.title;
            }
          }

          if (!label && customTitles[segment]) {
            label = customTitles[segment];
          }

          if (!label) {
            if (isUuid(segment)) {
              // Strictly never show raw system UUID to user
              label = "Form";
            } else {
              label = segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
            }
          }

          const isLast = idx === segments.length - 1;

          return (
            <React.Fragment key={href}>
              {idx > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="max-w-[140px] sm:max-w-[240px] md:max-w-none truncate font-medium">
                    {label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={href} className="max-w-[110px] sm:max-w-[160px] md:max-w-none truncate">
                    {label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
