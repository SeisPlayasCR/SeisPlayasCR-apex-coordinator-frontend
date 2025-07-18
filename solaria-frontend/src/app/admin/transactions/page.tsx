"use client";

import { useEffect, useState } from "react";
import moment from "moment";
import { Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { getAllTransaction } from "@/utils/services/services";
import { Spinner } from "../_components/Spinner";

interface Transaction {
  _id: string;
  totalAmount: number;
  dineIn: boolean;
  table_id: string;
  createdAt: string;
}

export default function TransactionsPage() {
  const { data, isSuccess, isLoading } = useQuery({
    queryKey: ["getTransactions"],
    queryFn: getAllTransaction,
  });
  console.log(data?.result?.data, "Heyyyyyyyyyyyyyyy");
  const [transactions, setTransactions] = useState<Transaction[]>([
    // {
    //     id: "t1",
    //     transactionId: "TRX001",
    //     amount: 150.75,
    //     type: "Income",
    //     date: "2024-07-10",
    // },
    // {
    //     id: "t2",
    //     transactionId: "TRX002",
    //     amount: 45.0,
    //     type: "Expense",
    //     date: "2024-07-09",
    // },
    // {
    //     id: "t3",
    //     transactionId: "TRX003",
    //     amount: 200.0,
    //     type: "Income",
    //     date: "2024-07-08",
    // },
    // {
    //     id: "t4",
    //     transactionId: "TRX004",
    //     amount: 12.5,
    //     type: "Expense",
    //     date: "2024-07-08",
    // },
    // {
    //     id: "t5",
    //     transactionId: "TRX005",
    //     amount: 500.0,
    //     type: "Income",
    //     date: "2024-07-07",
    // },
    // {
    //     id: "t6",
    //     transactionId: "TRX006",
    //     amount: 75.2,
    //     type: "Expense",
    //     date: "2024-07-06",
    // },
  ]);
  useEffect(() => {
    if (data) {
      setTransactions(data.result.data);
    }
  }, [isSuccess]);
  console.log(data, "Hey I am the data");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // Same as users page for consistency

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = transactions.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(transactions.length / itemsPerPage);

  return (
    <div className="py-8 px-4">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Historial de transacciones
            </h1>
            <p className="text-gray-600 mt-1">
              Ver todas las transacciones financieras en el sistema
            </p>
          </div>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Todas las transacciones</CardTitle>
            <CardDescription>
              Una lista detallada de todas las transacciones registradas.
            </CardDescription>
          </CardHeader>
          {isLoading ? (
            <div className="flex flex-col justify-center gap-1">
              <>
                <Spinner />
              </>
              <span className="text-center">Cargando transacciones</span>
            </div>
          ) : (
            <CardContent>
              <div id="transactions-table">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID de transacción</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>¿Qué pasa con din EI?</TableHead>
                      <TableHead>Id. de tabla</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8 text-gray-500"
                        >
                          No se encontraron transacciones.{" "}
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentTransactions.map((transaction, index) => (
                        <TableRow key={index}>
                          <TableCell className="flex items-center gap-2">
                            <span className="font-mono break-all">
                              {transaction._id}
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(transaction._id);
                                toast.success("ID copiado al portapapeles");
                              }}
                              className="text-muted-foreground hover:text-primary"
                              title="Copiar ID"
                            >
                              <Copy size={16} className="cursor-pointer" />
                            </button>
                          </TableCell>

                          {/* <TableCell className={transaction.type === "Income" ? "text-green-600" : "text-red-600"}>
                                                    {transaction.type === "Income" ? "+" : "-"} ${transaction.amount.toFixed(2)}
                                                </TableCell> */}
                          {/* <TableCell>
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${transaction.type === "Income" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                                            }`}
                                                    >
                                                        {transaction.type}
                                                    </span>
                                                </TableCell> */}
                          <TableCell>{transaction.totalAmount}</TableCell>
                          <TableCell>
                            {transaction.dineIn === true ? (
                              <span> Sí</span>
                            ) : (
                              <span>No</span>
                            )}
                          </TableCell>
                          <TableCell>{transaction.table_id}</TableCell>
                          <TableCell>
                            {moment(transaction.createdAt).format(
                              "MMMM Do YYYY, h:mm:ss a"
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          )}
          {/* Pagination */}
          {transactions.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4">
              <div className="text-sm text-gray-700">
                Showing {indexOfFirstItem + 1} to{" "}
                {Math.min(indexOfLastItem, transactions.length)} of{" "}
                {transactions.length} results
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  Previa
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8"
                      >
                        {page}
                      </Button>
                    )
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
