"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { getAllFacturas } from "@/utils/services/services";
import { toast } from "sonner";
import { saveAs } from "file-saver";

// ✅ Types
interface Customer {
  _id: string;
  name: string;
  code: string;
  phoneNumber: string;
}

interface Factura {
  _id: string;
  customerId: Customer;
  isBusiness: boolean;
  SolariaInvoiceId: string;
  createdAt: string;
  path?: string;
}

interface FacturaResponse {
  data: Factura[];
  totalPages: number;
}

export default function FacturasPage() {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isSuccess } = useQuery<FacturaResponse>({
    queryKey: ["getAllFacturas", currentPage],
    queryFn: () => getAllFacturas(currentPage),
  });

  useEffect(() => {
    if (isSuccess && data) {
      setFacturas(data.data);
      setTotalPages(data.totalPages);
    }
  }, [data, isSuccess]);

  const downloadFactura = async (factura: Factura) => {
    if (!factura?.path) {
      toast.error("No factura file available.");
      return;
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4003";
    const fileUrl = `${API_URL}${factura.path}`;
    const fileName = factura.path.split("/").pop() || "factura.pdf";

    try {
      const res = await fetch(fileUrl);
      if (!res.ok) throw new Error("Failed to fetch PDF");
      const blob = await res.blob();
      saveAs(blob, fileName);
    } catch (err) {
      console.error(`❌ Error downloading ${fileUrl}`, err);
      toast.error("Error downloading factura.");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Facturas</h1>
          <p className="text-gray-600 mt-1">
            Lista de todas las facturas generadas.
          </p>
        </div>

        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nombre del cliente</TableHead>
                  <TableHead>Número de teléfono</TableHead>
                  <TableHead>¿Es negocio?</TableHead>
                  <TableHead>SolariaInvoiceId</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facturas.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-gray-500"
                    >
                      No facturas found.
                    </TableCell>
                  </TableRow>
                ) : (
                  facturas.map((f) => (
                    <TableRow key={f._id}>
                      <TableCell>{f.customerId?._id}</TableCell>
                      <TableCell>{f.customerId?.name}</TableCell>
                      <TableCell>
                        {f.customerId?.code}
                        {f.customerId?.phoneNumber}
                      </TableCell>
                      <TableCell>{f.isBusiness ? "Sí" : "No"}</TableCell>
                      <TableCell>{f.SolariaInvoiceId}</TableCell>
                      <TableCell>
                        {mounted
                          ? new Date(f.createdAt).toLocaleString("es-CR", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : f.createdAt}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={!f?.path}
                          onClick={() => downloadFactura(f)}
                          className={`h-8 w-8 ${
                            !f?.path ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {facturas.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
