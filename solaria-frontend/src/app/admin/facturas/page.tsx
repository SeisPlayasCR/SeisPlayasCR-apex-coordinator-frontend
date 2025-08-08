"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Printer, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAllCustomers,
  getAllTransaction,
  sendToFactura,
} from "@/utils/services/services";
import { toast } from "sonner";
import moment from "moment";
import { saveAs } from "file-saver";
import * as z from "zod";
import { getAllFacturas } from "@/utils/services/services";

// ----------------------
// 🔒 Types & Interfaces
// ----------------------
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

interface Transaction {
  _id: string;
  createdAt: string;
  totalAmount: number;
}

interface User {
  _id: string;
  customerId: string;
  name: string;
  BusinessName?: string;
  isBusiness?: boolean;
  code: string;
  email: string;
  role: string;
  createdAt: string;
  phoneNumber?: string;
  facturas?: { path: string }[];
}

interface SendToFacturaPayload {
  transactionId: string;
  name: string;
  email: string;
  userId: string;
  phoneNumber: string;
  code: string;
  isBusiness: boolean;
  BusinessName: string;
}

// ----------------------
// 🔒 Validation Schema
// ----------------------
const userSchema = z
  .object({
    transactionId: z
      .string()
      .min(1, "Transaction ID is required")
      .min(3, "Please Enter Valid ID"),
    name: z
      .string()
      .min(1, "Name is required")
      .min(2, "Name must be at least 2 characters"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    userId: z
      .string()
      .min(1, "ID is required")
      .min(9, "El ID debe tener al menos 9 dígitos")
      .max(12, "El ID no debe tener más de 12 dígitos")
      .regex(/^\d+$/, "Solo se permiten números"),
    phoneNumber: z
      .string()
      .min(1, "Phone number is required")
      .min(8, "Phone number must be at least 8 digits")
      .max(15, "Phone number cannot exceed 15 digits"),
    code: z.string().min(2, "Country code is required"),
    isBusiness: z.enum(["true", "false"]),
    businessName: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.isBusiness === "true") {
        return !!data.businessName?.trim();
      }
      return true;
    },
    {
      path: ["businessName"],
      message: "El nombre de la empresa es obligatorio.",
    }
  )
  .refine(
    (data) => {
      if (data.isBusiness === "true") {
        return data.userId.length >= 10;
      }
      return true;
    },
    {
      path: ["userId"],
      message: "El ID debe tener al menos 10 dígitos si es una empresa.",
    }
  );

export type UserFormValues = z.infer<typeof userSchema>;

// ----------------------
// 🌍 Country Codes
// ----------------------
const countryCodes = [
  { code: "+506", country: "Costa Rica", flag: "🇨🇷", popular: true },
  { code: "+1", country: "United States", flag: "🇺🇸", popular: true },
  { code: "+1", country: "Canada", flag: "🇨🇦", popular: true },
  { code: "+44", country: "United Kingdom", flag: "🇬🇧", popular: true },
  { code: "+49", country: "Germany", flag: "🇩🇪", popular: true },
  { code: "+33", country: "France", flag: "🇫🇷", popular: true },
  { code: "+39", country: "Italy", flag: "🇮🇹", popular: true },
  { code: "+34", country: "Spain", flag: "🇪🇸", popular: true },
  { code: "+91", country: "India", flag: "🇮🇳", popular: true },
  { code: "+86", country: "China", flag: "🇨🇳", popular: true },
  { code: "+81", country: "Japan", flag: "🇯🇵", popular: true },
  { code: "+82", country: "South Korea", flag: "🇰🇷", popular: true },
  { code: "+61", country: "Australia", flag: "🇦🇺", popular: true },
  { code: "+55", country: "Brazil", flag: "🇧🇷", popular: true },
  { code: "+52", country: "Mexico", flag: "🇲🇽", popular: true },
  { code: "+7", country: "Russia", flag: "🇷🇺", popular: true },
];

// Mock API functions - replace with your actual API calls

// const getAllTransaction = async (): Promise<{
//   result: { data: Transaction[] };
// }> => {
//   // Replace with actual API call
//   return new Promise((resolve) => {
//     setTimeout(() => {
//       resolve({
//         result: {
//           data: [
//             {
//               _id: "trans_1",
//               createdAt: new Date().toISOString(),
//               totalAfterTax: 100.5,
//             },
//           ],
//         },
//       });
//     }, 1000);
//   });
// };

// const getAllCustomers = async (): Promise<{ result: User[] }> => {
//   // Replace with actual API call
//   return new Promise((resolve) => {
//     setTimeout(() => {
//       resolve({
//         result: [],
//       });
//     }, 1000);
//   });
// };

// const sendToFactura = async (
//   data: SendToFacturaPayload
// ): Promise<{ message: string }> => {
//   // Replace with actual API call
//   return new Promise((resolve, reject) => {
//     setTimeout(() => {
//       if (Math.random() > 0.5) {
//         resolve({ message: "Factura generated successfully!" });
//       } else {
//         reject(new Error("Failed to generate factura"));
//       }
//     }, 2000);
//   });
// };

export default function FacturasPage() {
  // ----------------------
  // 🛠️ State Management
  // ----------------------
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [mounted, setMounted] = useState<boolean>(false);
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // ----------------------
  // 🔗 React Query Hooks
  // ----------------------
  const { data: facturaData, isSuccess: facturaSuccess } =
    useQuery<FacturaResponse>({
      queryKey: ["getAllFacturas", currentPage],
      queryFn: () => getAllFacturas(currentPage),
    });

  const { data: transactionData, isSuccess: transactionSuccess } = useQuery({
    queryKey: ["getTransactions"],
    queryFn: getAllTransaction,
    refetchInterval: 30000, // Reduced from 2000ms to 30s for better performance
  });

  const { data: customerData, isSuccess: customerSuccess } = useQuery({
    queryKey: ["getAllCustomers"],
    queryFn: getAllCustomers,
  });
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

  // const downloadFactura = async (factura: Factura) => {
  //   if (!factura?.path) {
  //     toast.error("No factura file available.");
  //     return;
  //   }

  //   const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4003";
  //   const fileUrl = `${API_URL}${factura.path}`;
  //   const fileName = factura.path.split("/").pop() || "factura.pdf";

  //   try {
  //     const res = await fetch(fileUrl);
  //     if (!res.ok) throw new Error("Failed to fetch PDF");
  //     const blob = await res.blob();
  //     saveAs(blob, fileName);
  //   } catch (err) {
  //     console.error(`❌ Error downloading ${fileUrl}`, err);
  //     toast.error("Error downloading factura.");
  //   }
  // };
  const { mutate: generateFactura, isPending } = useMutation({
    mutationFn: (data: SendToFacturaPayload) => sendToFactura(data),
    onSuccess: (data) => {
      toast.success(data.message);
      form.reset();
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["getAllFacturas"] });
      queryClient.invalidateQueries({ queryKey: ["getAllCustomers"] });
    },
    onError: (error: Error) => {
      console.error("Error generating factura:", error);
      toast.error(error.message || "Failed to generate factura");
    },
  });

  // ----------------------
  // 📝 Form Setup
  // ----------------------
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      transactionId: "",
      name: "",
      email: "",
      userId: "",
      phoneNumber: "",
      code: "+506",
      isBusiness: "false",
      businessName: "",
    },
  });

  // ----------------------
  // 🔄 Effects
  // ----------------------
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (facturaSuccess && facturaData) {
      setFacturas(facturaData.data);
      setTotalPages(facturaData.totalPages);
    }
  }, [facturaData, facturaSuccess]);

  useEffect(() => {
    if (transactionSuccess && transactionData) {
      setTransactions(transactionData.result.data);
    }
  }, [transactionData, transactionSuccess]);

  useEffect(() => {
    if (customerSuccess && customerData) {
      setUsers(customerData.result);
    }
  }, [customerData, customerSuccess]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // ----------------------
  // 🔧 Helper Functions
  // ----------------------
  const downloadFactura = async (factura: Factura) => {
    if (!factura?.path) {
      toast.error("No factura file available.");
      return;
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4003";
    const fileUrl = `${API_URL}${factura.path}`;
    const fileName = factura.path.split("/").pop() || "factura.pdf";

    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error("Failed to fetch PDF");

      const blob = await response.blob();
      saveAs(blob, fileName);
      toast.success("Factura downloaded successfully!");
    } catch (error) {
      console.error(`Error downloading ${fileUrl}:`, error);
      toast.error("Error downloading factura.");
    }
  };

  const handleNameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    form.setValue("name", value);

    if (value.trim()) {
      const filtered = users.filter((user) =>
        user.name?.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredUsers(filtered);
      setShowSuggestions(true);
    } else {
      setFilteredUsers([]);
      setShowSuggestions(false);
      // Clear dependent fields when name is cleared
      form.setValue("email", "");
      form.setValue("userId", "");
      form.setValue("phoneNumber", "");
      form.setValue("businessName", "");
    }
  };

  const handleSelectUser = (user: User) => {
    form.setValue("name", user.name, { shouldValidate: true });
    form.setValue("email", user.email);
    form.setValue("userId", user.customerId);
    form.setValue("phoneNumber", user.phoneNumber || "");

    // Auto-select country code based on phone number
    if (user.phoneNumber && user.code) {
      const matchedCode = countryCodes.find((c) =>
        user.code.startsWith(c.code)
      );
      if (matchedCode) {
        form.setValue("code", matchedCode.code);
        const cleanNumber = user.phoneNumber
          .replace(matchedCode.code, "")
          .trim();
        form.setValue("phoneNumber", cleanNumber);
      }
    }

    // Set business information
    form.setValue("isBusiness", user.isBusiness ? "true" : "false");
    if (user.BusinessName) {
      form.setValue("businessName", user.BusinessName);
    }

    setShowSuggestions(false);
  };

  const onSubmit = (data: UserFormValues) => {
    const payload: SendToFacturaPayload = {
      transactionId: data.transactionId,
      name: data.name,
      email: data.email,
      userId: data.userId,
      phoneNumber: data.phoneNumber,
      code: data.code,
      isBusiness: data.isBusiness === "true",
      BusinessName: data.businessName || "",
    };

    console.log("Submitting payload:", payload);
    generateFactura(payload);
  };

  const countryCode = form.watch("code");
  const isBusiness = form.watch("isBusiness");

  // ----------------------
  // 🖼️ Render
  // ----------------------
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex gap-2"></div>
        </div>

        {/* Facturas Table */}
        <div className="flex flex-col space-y-6">
          {/* Header with button on right */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Facturas</h2>
              <p className="text-gray-600 mt-1">
                Lista de todas las facturas generadas.
              </p>
            </div>

            {/* Add user dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Generar factura
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto p-6">
                <DialogHeader>
                  <DialogTitle>Generar factura</DialogTitle>
                  <DialogDescription>
                    Complete la siguiente información para Generar Factura
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    {/* Transaction ID */}
                    <FormField
                      control={form.control}
                      name="transactionId"
                      render={({ field }) => {
                        const selectedTransaction = transactions.find(
                          (item) => item._id === field.value
                        );
                        return (
                          <FormItem>
                            <FormLabel>ID de transacción</FormLabel>
                            <FormControl>
                              <div>
                                <select
                                  {...field}
                                  className="w-full border rounded-md px-3 py-2 bg-white"
                                >
                                  <option value="">Seleccione un ID</option>
                                  {transactions.map((item) => (
                                    <option key={item._id} value={item._id}>
                                      {`${item._id} — ${moment(
                                        item.createdAt
                                      ).format(
                                        "MMMM Do YYYY, HH:mm:ss"
                                      )} — $${Number(
                                        item.totalAmount ?? 0
                                      ).toFixed(2)}`}
                                    </option>
                                  ))}
                                </select>
                                {selectedTransaction && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    {moment(
                                      selectedTransaction.createdAt
                                    ).format("MMMM Do YYYY, HH:mm:ss")}{" "}
                                    — $
                                    {Number(
                                      selectedTransaction.totalAmount ?? 0
                                    ).toFixed(2)}
                                  </p>
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />

                    {/* Name with autocomplete */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre</FormLabel>
                          <div className="relative" ref={wrapperRef}>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  placeholder="Ingrese el nombre del usuario o busque..."
                                  {...field}
                                  onChange={handleNameInputChange}
                                  onFocus={() => setShowSuggestions(true)}
                                  className="pr-10"
                                />
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                              </div>
                            </FormControl>
                            {showSuggestions && filteredUsers.length > 0 && (
                              <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-md shadow-lg top-full mt-1 max-h-48 overflow-y-auto">
                                {filteredUsers.map((user) => (
                                  <div
                                    key={user._id}
                                    className="px-4 py-2 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                                    onMouseDown={() => handleSelectUser(user)}
                                  >
                                    <div className="font-medium">
                                      {user.name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {user.email}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Email */}
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Correo electrónico</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Ingrese la dirección de correo electrónico"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* User ID */}
                    <FormField
                      control={form.control}
                      name="userId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ID de usuario | Business ID</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ingrese un ID de usuario único"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Business Type */}
                    <FormField
                      control={form.control}
                      name="isBusiness"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>¿Es una empresa?</FormLabel>
                          <FormControl>
                            <div className="flex items-center space-x-4">
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="radio"
                                  value="true"
                                  checked={field.value === "true"}
                                  onChange={() => field.onChange("true")}
                                  className="text-blue-600"
                                />
                                <span>Sí</span>
                              </label>
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="radio"
                                  value="false"
                                  checked={field.value === "false"}
                                  onChange={() => field.onChange("false")}
                                  className="text-blue-600"
                                />
                                <span>No</span>
                              </label>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Business Name (conditional) */}
                    {isBusiness === "true" && (
                      <FormField
                        control={form.control}
                        name="businessName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre de empresa</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ingrese el nombre de la empresa"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Phone number with country code */}
                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número de teléfono</FormLabel>
                          <FormControl>
                            <div className="flex gap-2">
                              <select
                                value={countryCode}
                                onChange={(e) =>
                                  form.setValue("code", e.target.value)
                                }
                                className="w-[200px] rounded-md border border-gray-300 bg-white h-10 px-2 text-sm"
                              >
                                {countryCodes
                                  .sort(
                                    (a, b) =>
                                      Number(b.popular) - Number(a.popular)
                                  )
                                  .map((country, idx) => (
                                    <option
                                      key={`${country.code}-${idx}`}
                                      value={country.code}
                                    >
                                      {country.flag} {country.country} (
                                      {country.code})
                                    </option>
                                  ))}
                              </select>
                              <Input
                                placeholder="3001234567"
                                className="flex-1 h-10"
                                value={field.value}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value.replace(/\D/g, "")
                                  )
                                }
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Form Actions */}
                    <div className="flex justify-end space-x-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={isPending}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isPending}>
                        {isPending ? "Generando..." : "Generar factura"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <CardContent className="p-0">
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
                        No se encontraron facturas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    facturas.map((factura) => (
                      <TableRow key={factura._id}>
                        <TableCell className="font-mono text-sm">
                          {factura.customerId?._id}
                        </TableCell>
                        <TableCell className="font-medium">
                          {factura.customerId?.name}
                        </TableCell>
                        <TableCell>
                          {factura.customerId?.code}
                          {factura.customerId?.phoneNumber}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              factura.isBusiness
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {factura.isBusiness ? "Sí" : "No"}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {factura.SolariaInvoiceId}
                        </TableCell>
                        <TableCell>
                          {mounted
                            ? new Date(factura.createdAt).toLocaleString(
                                "es-CR",
                                {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                  hour12: false, // 👈 forces 24-hour format
                                }
                              )
                            : factura.createdAt}
                        </TableCell>
                        <TableCell className="text-right">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={!factura?.path}
                                  onClick={() => downloadFactura(factura)}
                                  className={`h-8 w-8 ${
                                    !factura?.path
                                      ? "opacity-50 cursor-not-allowed"
                                      : "hover:bg-gray-100"
                                  }`}
                                >
                                  <Printer className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {factura?.path
                                    ? "Descargar factura"
                                    : "Factura no disponible"}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {facturas.length > 0 && (
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
