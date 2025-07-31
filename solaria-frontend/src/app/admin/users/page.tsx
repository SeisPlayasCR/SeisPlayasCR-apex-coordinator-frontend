"use client";

import type React from "react";

import { useState, useEffect } from "react";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { getAllCustomers, getAllTransaction } from "@/utils/services/services";
import { toast } from "sonner";
import JSZip from "jszip";
import { saveAs } from "file-saver";

type Transaction = {
  _id: string;
  createdAt: string;
  totalAfterTax: number;
};

// ----------------------
// 🔒 Interfaces
// ----------------------

export interface User {
  _id: string;
  customerId: string; // transactionId
  name: string;
  BusinessName?: string;
  isBusiness?: boolean;
  code: string; // true or false
  email: string;
  role: string;
  createdAt: string;
  phoneNumber?: string;
  facturas?: { path: string }[];
}

export default function UsersPage() {
  // ----------------------
  // 🛠️ Hooks & State
  // ----------------------

  const [users, setUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [mounted, setMounted] = useState(false);

  const [transactioId, setTransactionId] = useState<Transaction[] | []>([]);

  const { data: transactionData, isSuccess: transactionSuccess } = useQuery({
    queryKey: ["getTransactions"],
    queryFn: getAllTransaction,
    refetchInterval: 2000,
  });
  useEffect(() => {
    if (transactionData) {
      setTransactionId(transactionData.result.data);
    }
  }, [transactionSuccess]);
  console.log(transactioId, "Hey I am the ooooo");

  // 🔑 Suggestions dropdown wrapper (input + list)

  // Pagination helpers
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = users.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(users.length / itemsPerPage);

  // ----------------------
  // 📝 React‑Hook‑Form
  // ----------------------

  // ----------------------
  // 🔗 React‑Query – add user
  // ----------------------

  // ----------------------
  // 🔗 React‑Query – fetch users
  // ----------------------
  const { data, isSuccess } = useQuery({
    queryKey: ["getAllCustomers"],
    queryFn: getAllCustomers,
  });

  useEffect(() => {
    if (isSuccess && data) setUsers(data.result);
  }, [isSuccess, data]);

  // Ensure moment only runs client‑side
  useEffect(() => setMounted(true), []);

  // ----------------------
  // 📦 Download facturas
  // ----------------------
  const downloadFacturas = async (facturas: { path: string }[]) => {
    if (!facturas?.length) {
      toast.error("No facturas found.");
      return;
    }

    const zip = new JSZip();
    const folder = zip.folder("facturas");
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4003";

    for (const { path } of facturas) {
      const fileName = path.split("/").pop() || "factura.pdf";
      const fileUrl = `${API_URL}${path}`;

      try {
        const res = await fetch(fileUrl);
        if (!res.ok) throw new Error("Fetch failed");
        folder?.file(fileName, await res.blob());
      } catch (err) {
        console.error(`❌ Failed to download ${fileUrl}`, err);
      }
    }

    zip
      .generateAsync({ type: "blob" })
      .then((content) => saveAs(content, "facturas.zip"));
  };

  // ----------------------
  // 🖼️ JSX
  // ----------------------
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Gestión de usuarios
            </h1>
            <p className="text-gray-600 mt-1">
              Administrar y ver todas las usuarios del sistema.
            </p>
          </div>
        </div>

        {/* ------------------ */}
        {/* Users Table */}
        {/* ------------------ */}
        <Card>
          <CardContent>
            <div id="users-table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">ID de cliente</TableHead>
                    <TableHead>ID de transacción</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Correo electrónico</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">
                      Todas las facturas{" "}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-8 text-gray-500"
                      >
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentUsers.map((u) => (
                      <TableRow key={u._id}>
                        <TableCell>{u._id}</TableCell>
                        <TableCell>{u.customerId}</TableCell>
                        <TableCell>{u.name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.role}</TableCell>
                        <TableCell>
                          {mounted
                            ? new Date(u.createdAt).toLocaleString("es-CR", {
                                dateStyle: "medium",
                                timeStyle: "short",
                                hour12: false, // 👈 forces 24-hour format
                              })
                            : u.createdAt}
                        </TableCell>
                        <TableCell className="text-right">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={!u?.facturas?.length}
                                  onClick={() =>
                                    u.facturas && downloadFacturas(u.facturas)
                                  }
                                  className={`h-8 w-8 ${
                                    !u?.facturas?.length
                                      ? "cursor-not-allowed opacity-50"
                                      : ""
                                  }`}
                                >
                                  <Printer className="h-4 w-4" />
                                  <span className="sr-only">
                                    Download all facturas for {u.name}
                                  </span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Download all facturas</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>

          {/* Pagination */}

          {users.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-gray-700">
                Página {currentPage} de {totalPages}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
