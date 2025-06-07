import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useEffect, useState } from "react";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date) {
  if (!date) return ""; // Return empty string if date is undefined/null
  const parsedDate = new Date(date);
  return isNaN(parsedDate) ? "" : parsedDate.toISOString().split("T")[0];
}

export const formatDateTimestamp = (timestamp) => {
  if (!timestamp) return "";

  const date = new Date(timestamp);

  // Get the original string format (in case it's a plain date string like "2025-03-29")
  const isPlainDate =
    typeof timestamp === "string" && /^\d{4}-\d{2}-\d{2}$/.test(timestamp);

  if (isPlainDate || (date.getHours() === 0 && date.getMinutes() === 0)) {
    // Return only the date
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // Otherwise, return full date and time
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export function parseLocalDate(dateString) {
  if (!dateString || typeof dateString !== "string") return null;

  const [yearStr, monthStr, dayStr] = dateString.split("T")[0].split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // 0-based in JS
  const day = parseInt(dayStr, 10);

  // Check if numbers are valid
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

  // Construct a local date (no timezone issues)
  return new Date(year, month, day);
}

export function parseDateAsLocal(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return null;

  // Supports ISO with or without time
  const clean = dateStr.split("T")[0]; // e.g., "2025-01-18"
  const [year, month, day] = clean.split("-").map(Number);
  return new Date(year, month - 1, day); // local time
}

export function fixUTCZDate(dateString) {
  if (!dateString) return null;

  const utcDate = new Date(dateString);
  return new Date(
    utcDate.getUTCFullYear(),
    utcDate.getUTCMonth(),
    utcDate.getUTCDate()
  );
}

export const prepareDataForExport = (table, data) => {
  // 1️⃣ Get the visible headers with their display names
  const headers = table
    .getHeaderGroups()[0]
    .headers.filter(
      (header) =>
        header.column.id !== "select" && header.column.id !== "actions"
    )
    .map((header) => ({
      id: header.column.id,
      title: header.column.columnDef.header,
    }));

  // 2️⃣ Get the rows and format correctly
  const rows = data.map((row) => {
    const rowData = {};

    headers.forEach((header) => {
      if (header.id === "debit_amount") {
        rowData[header.title] =
          row.debit_credit === "Debit"
            ? parseFloat(row.amount ?? 0).toLocaleString()
            : "0.00";
      } else if (header.id === "credit_amount") {
        rowData[header.title] =
          row.debit_credit === "Credit"
            ? parseFloat(row.amount ?? 0).toLocaleString()
            : "0.00";
      } else if (header.id === "running_balance") {
        rowData[header.title] = parseFloat(
          row.running_balance ?? 0
        ).toLocaleString();
      } else {
        rowData[header.title] = row[header.id] ?? "-";
      }
    });

    return rowData;
  });

  // 3️⃣ Map the titles for the header row in the exported file
  const mappedHeaders = headers.map((header) => header.title);

  return {
    headers: mappedHeaders,
    rows,
  };
};

export const getValidDate = (date, fallback) => {
  return date && !isNaN(new Date(date).getTime()) ? new Date(date) : fallback;
};

export function useDebounce(value, delay = 5000) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debounced;
}

export function hasPermissionCode(roles, permissionCode) {
  return roles?.includes(permissionCode);
}

export function hasPermissionByCode(roles, permissionCode) {
  return roles?.some((perm) => perm === permissionCode);
}

export function hasPermission(roles, codes) {
  if (!roles) return false;
  const userPermissions = roles;
  if (Array.isArray(codes)) {
    // Return true if **any** of the permissions match
    return codes.some((code) => userPermissions.includes(code));
  }
  // Handle single permission check
  return userPermissions.includes(codes);
}
