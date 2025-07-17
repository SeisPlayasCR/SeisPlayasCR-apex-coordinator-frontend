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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAllCustomers, sendToFactura } from "@/utils/services/services";
import { toast } from "sonner";
import moment from "moment";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import * as z from "zod"

// ----------------------
// 🔒 Validation Schema
// ----------------------

const userSchema = z
    .object({
        transactionId: z.string().min(3, "Please Enter Id"),
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Please enter a valid email address"),
        userId: z.string().min(3, "User ID must be at least 3 characters"),
        phoneNumber: z.string().min(10).max(15),
        code: z.string().min(2),
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
    );

export type UserFormValues = z.infer<typeof userSchema>;

// Popular country codes first
const countryCodes = [
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
    { code: "+92", country: "Pakistan", flag: "🇵🇰", popular: false },
];

// ----------------------
// 🔒 Interfaces
// ----------------------
interface SendToFacturaPayload {
    transactionId: string;
    name: string;
    email: string;
    userId: string;
    phoneNumber: string;
    code: string;
    isBusiness: string;
    BusinessName: string; // Note: Capital B to match API
}

export interface User {
    _id: string;
    customerId: string; // transactionId
    name: string;
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
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [mounted, setMounted] = useState(false);

    // 🔑 Suggestions dropdown wrapper (input + list)
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Pagination helpers
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentUsers = users.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(users.length / itemsPerPage);

    // ----------------------
    // 📝 React‑Hook‑Form
    // ----------------------
    const form = useForm<UserFormValues>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            transactionId: "",
            name: "",
            email: "",
            userId: "",
            phoneNumber: "",
            code: "+1",
            isBusiness: "false",
            businessName: "",
        },
    });
    // ----------------------
    // 🔗 React‑Query – add user
    // ----------------------
    const { mutate, isPending } = useMutation({
        mutationFn: (data: SendToFacturaPayload) =>
            // Convert isBusiness from string to boolean before sending
            sendToFactura({
                ...data,
                isBusiness: data.isBusiness === "true",
            }),
        onSuccess: () => {
            toast.success("User added successfully!");
            form.reset();
            setOpen(false);
            queryClient.invalidateQueries({ queryKey: ["getAllCustomers"] });
        },
        onError: () => toast.error("Failed to add user. Please try again."),
    });

    const onSubmit = (data: UserFormValues) => {
        const payload: SendToFacturaPayload = {
            transactionId: data.transactionId,
            name: data.name,
            email: data.email,
            userId: data.userId,
            phoneNumber: data.phoneNumber,
            code: data.code,
            isBusiness: data.isBusiness,
            BusinessName: data.businessName || "",
        };

        console.log("Submitting payload:", payload);
        mutate(payload);
    }
    // ----------------------
    // 🔗 React‑Query – fetch users
    // ----------------------
    const { data, isSuccess } = useQuery({ queryKey: ["getAllCustomers"], queryFn: getAllCustomers });

    useEffect(() => {
        if (isSuccess && data) setUsers(data.result);
    }, [isSuccess, data]);

    // Ensure moment only runs client‑side
    useEffect(() => setMounted(true), []);

    // ----------------------
    // 🔍 Autocomplete helpers
    // ----------------------
    const handleNameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        form.setValue("name", value);

        if (value) {
            const f = users.filter((u) => u.name.toLowerCase().includes(value.toLowerCase()));
            setFilteredUsers(f);
            setShowSuggestions(true);
        } else {
            setFilteredUsers([]);
            setShowSuggestions(false);
            form.setValue("email", "");
            form.setValue("userId", "");
            form.setValue("phoneNumber", "");
        }
    };

    const handleSelectUser = (user: User) => {
        form.setValue("name", user.name, { shouldValidate: true });
        form.setValue("email", user.email);
        form.setValue("userId", user._id);
        form.setValue("phoneNumber", user.phoneNumber || "");
        setShowSuggestions(false);
    };

    // Close suggestions only when clicking *outside* the wrapper (input + list)
    useEffect(() => {
        const listener = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener("click", listener);
        return () => document.removeEventListener("click", listener);
    }, []);

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

        zip.generateAsync({ type: "blob" }).then((content) => saveAs(content, "facturas.zip"));
    };

    const countryCode = form.watch("code");

    // ----------------------
    // 🖼️ JSX
    // ----------------------
    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex flex-col space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Gestión de usuarios</h1>
                        <p className="text-gray-600 mt-1">Administrar y ver todas las usuarios del sistema.</p>
                    </div>
                    {/* Add user dialog */}
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="flex items-center gap-2">
                                <Plus className="h-4 w-4" /> Agregar usuario
                            </Button>
                        </DialogTrigger>

                        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-6">
                            <DialogHeader>
                                <DialogTitle>Agregar nuevo usuario</DialogTitle>
                                <DialogDescription>
                                    Complete los datos a continuación para crear una nueva cuenta de usuario.
                                </DialogDescription>
                            </DialogHeader>

                            {/* ------------------ */}
                            {/* Form */}
                            {/* ------------------ */}
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    {/* Transaction ID */}
                                    <FormField
                                        control={form.control}
                                        name="transactionId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>ID de transacción</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ingrese el ID de transacción" {...field} className="pr-10" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Name + autocomplete */}
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nombre</FormLabel>
                                                <div className="relative" ref={wrapperRef}>
                                                    {/* Input */}
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
                                                    {/* Dropdown */}
                                                    {showSuggestions && filteredUsers.length > 0 && (
                                                        <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-md shadow-lg top-full mt-1 max-h-48 overflow-y-auto">
                                                            {filteredUsers.map((u) => (
                                                                <div
                                                                    key={u._id}
                                                                    className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                                                                    onMouseDown={() => handleSelectUser(u)} // ✅ use onMouseDown so selection fires before click‑outside closes
                                                                >
                                                                    {u.name} ({u.email})
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
                                                    <Input type="email" placeholder="Ingrese la dirección de correo electrónico" {...field} />
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
                                                    <Input placeholder="Ingrese un ID de usuario único" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Business ID */}

                                    <FormField
                                        control={form.control}
                                        name="isBusiness"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>¿Es una empresa?</FormLabel>
                                                <FormControl>
                                                    <div className="flex items-center space-x-4">
                                                        <label className="flex items-center space-x-2">
                                                            <input
                                                                type="radio"
                                                                value="true"
                                                                checked={field.value === "true"}
                                                                onChange={() => field.onChange("true")}
                                                            />
                                                            <span>Sí</span>
                                                        </label>
                                                        <label className="flex items-center space-x-2">
                                                            <input
                                                                type="radio"
                                                                value="false"
                                                                checked={field.value === "false"}
                                                                onChange={() => field.onChange("false")}
                                                            />
                                                            <span>No</span>
                                                        </label>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Business Name (optional) */}
                                    {form.watch("isBusiness") === "true" && (
                                        <FormField
                                            control={form.control}
                                            name="businessName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Nombre de empresa</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Ingrese el nombre de la empresa" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}


                                    {/* Phone number + code */}
                                    <FormField
                                        control={form.control}
                                        name="phoneNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Número de teléfono</FormLabel>
                                                <FormControl>
                                                    <div className="flex gap-2">
                                                        {/* Country code */}
                                                        <select
                                                            value={countryCode}
                                                            onChange={(e) => {
                                                                const selected = e.target.value;
                                                                form.setValue("code", selected);
                                                            }}
                                                            className="w-[200px] rounded-md border border-gray-300 bg-white h-10 px-2 text-sm"
                                                        >
                                                            {countryCodes
                                                                .sort((a, b) => Number(b.popular) - Number(a.popular))
                                                                .map((c, idx) => (
                                                                    <option key={`${c.code}-${idx}`} value={c.code}>
                                                                        {c.flag} {c.country} ({c.code})
                                                                    </option>
                                                                ))}
                                                        </select>

                                                        {/* Phone number input */}
                                                        <Input
                                                            placeholder="3001234567"
                                                            className="flex-1 h-10"
                                                            value={field.value}
                                                            onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))}
                                                        />


                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Actions */}
                                    <div className="flex justify-end space-x-3 pt-4">
                                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                            Cancelar
                                        </Button>
                                        <Button type="submit" disabled={isPending}>
                                            {isPending ? "Agregando..." : "Agregar usuario"}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div >

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
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                                                No users found. Add a new user to get started.
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
                                                    {mounted ? moment(u.createdAt).format("MMMM Do YYYY, h:mm:ss a") : u.createdAt}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    disabled={!u?.facturas?.length}
                                                                    onClick={() => u.facturas && downloadFacturas(u.facturas)}
                                                                    className={`h-8 w-8 ${!u?.facturas?.length ? "cursor-not-allowed opacity-50" : ""}`}
                                                                >
                                                                    <Printer className="h-4 w-4" />
                                                                    <span className="sr-only">Download all facturas for {u.name}</span>
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
                        <div className="flex items-center justify-between px-6 py-4">
                            <div className="text-sm text-gray-700">
                                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, users.length)} of {users.length} results
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </Button>
                                <div className="flex items-center space-x-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <Button
                                            key={page}
                                            variant={currentPage === page ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setCurrentPage(page)}
                                            className="w-8 h-8"
                                        >
                                            {page}
                                        </Button>
                                    ))}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div >
        </div >
    );
}
