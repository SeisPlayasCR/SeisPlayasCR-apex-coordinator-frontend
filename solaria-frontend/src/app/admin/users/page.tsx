"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Plus, Printer, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useMutation, useQuery } from "@tanstack/react-query"
import { getAllCustomers, sendToFactura } from "@/utils/services/services" // Assuming these services exist
import { toast } from "sonner"
import moment from "moment"
import JSZip from "jszip"
import { saveAs } from "file-saver"

const userSchema = z.object({
    transactionId: z.string().min(3, "Please Enter Id"),
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    userId: z.string().min(3, "User ID must be at least 3 characters"),
    businessId: z.string().min(3, "Business ID must be at least 3 characters"), // Added
    phoneNumber: z
        .string()
        .min(10, "Phone number must be at least 10 digits")
        .max(15, "Phone number cannot exceed 15 digits"), // Added
    userType: z.string().min(1, "Please select a user type"),
})

type UserFormValues = z.infer<typeof userSchema>

interface sendToFacturaInterface {
    transactionId: string
    name: string
    email: string
    userId: string
    businessId: string // Added
    phoneNumber: string // Added
    userType: string
}

interface User {
    _id: string
    customerId: string
    name: string
    email: string
    role: string
    // createdAt: string
    facturas: { path: string }[]
}

export default function UsersPage() {
    const [open, setOpen] = useState(false)
    const [users, setUsers] = useState<User[]>([])
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(5)

    // Calculate pagination
    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    const currentUsers = users.slice(indexOfFirstItem, indexOfLastItem)
    const totalPages = Math.ceil(users.length / itemsPerPage)

    const form = useForm<UserFormValues>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            transactionId: "",
            name: "",
            email: "",
            userId: "",
            businessId: "", // Added
            phoneNumber: "", // Added
            userType: "",
        },
    })

    // Initialize useMutation hook
    const { mutate, isPending } = useMutation({
        mutationFn: (data: sendToFacturaInterface) => sendToFactura(data),
        onSuccess: (data) => {
            console.log("User added successfully:", data)
            toast.success("User added successfully!")
            form.reset()
            setOpen(false)
            // Optionally refetch users after successful addition
            // queryClient.invalidateQueries(['getAllCustomers']);
        },
        onError: (error) => {
            console.error("Error adding user:", error)
            toast.error("Failed to add user. Please try again.")
        },
    })

    const onSubmit = async (data: UserFormValues) => {
        console.log("Form submitted with data:", data)
        await mutate(data)
    }

    const { data, isSuccess } = useQuery({ queryKey: ["getAllCustomers"], queryFn: getAllCustomers })

    useEffect(() => {
        if (data) {
            setUsers(data.result)
        }
    }, [isSuccess, data])

    const downloadFacturas = async (facturas: { path: string }[]) => {
        if (!facturas?.length) {
            alert("No facturas found.")
            return
        }
        const zip = new JSZip()
        const folder = zip.folder("facturas")
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4003"

        for (const { path } of facturas) {
            const fileName = path.split("/").pop() || "factura.pdf"
            const fileUrl = `${API_URL}${path}`
            try {
                const response = await fetch(fileUrl)
                if (!response.ok) throw new Error(`Failed to fetch: ${fileUrl}`)
                const blob = await response.blob()
                folder?.file(fileName, blob)
            } catch (err) {
                console.error(`Failed to download ${fileUrl}`, err)
            }
        }

        zip
            .generateAsync({ type: "blob" })
            .then((content) => {
                saveAs(content, "facturas.zip")
            })
            .catch((err) => {
                console.error("Failed to generate zip", err)
            })
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex flex-col space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Gestión de usuarios</h1>
                        <p className="text-gray-600 mt-1">Administrar y ver todas las usuarios del sistema.</p>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                Agregar usuario                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-6">
                            <DialogHeader>
                                <DialogTitle>Agregar nuevo usuario</DialogTitle>
                                <DialogDescription>Complete los datos a continuación para crear una nueva cuenta de usuario.</DialogDescription>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="transactionId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>ID de transacción</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input placeholder="Ingrese el ID de transacción" {...field} className="pr-10" />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nombre</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input placeholder="Ingrese el nombre del usuario o busque..." {...field} className="pr-10" />
                                                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
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
                                    <FormField
                                        control={form.control}
                                        name="userId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>ID de usuario</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ingrese un ID de usuario único" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="businessId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>ID de empresa</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ingrese el ID de empresa" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="phoneNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Número de teléfono</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ingrese el número de teléfono" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="userType"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tipo de usuario</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Seleccione el tipo de usuario" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="w-full space-y-1">
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <SelectItem value="01">01</SelectItem>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Persona física costarricense</p>
                                                                </TooltipContent>
                                                            </Tooltip>

                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <SelectItem value="02">02</SelectItem>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Persona jurídica costarricense estatal (pública) o privada</p>
                                                                </TooltipContent>
                                                            </Tooltip>

                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <SelectItem value="03">03</SelectItem>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Persona física extranjera (DIMEX)</p>
                                                                </TooltipContent>
                                                            </Tooltip>

                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <SelectItem value="04">04</SelectItem>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Número de identificación tributario para personas físicas (NITE)</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

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
                </div>
                {/* Users Table */}
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
                                        {/* <TableHead>Fecha</TableHead> */}
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
                                        currentUsers.map((user, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{user._id}</TableCell>
                                                <TableCell>{user.customerId}</TableCell>
                                                <TableCell>{user.name}</TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell>{user.role}</TableCell>
                                                {/* <TableCell>{moment(user.createdAt).format("MMMM Do YYYY, h:mm:ss a")}</TableCell> */}
                                                <TableCell className="text-right">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    disabled={!user.facturas?.length}
                                                                    onClick={() => user.facturas?.length && downloadFacturas(user.facturas)}
                                                                    className={`h-8 w-8 ${!user.facturas?.length ? "cursor-not-allowed opacity-50" : ""}`}
                                                                >
                                                                    <Printer className="h-4 w-4" />
                                                                    <span className="sr-only">Download all facturas for {user.name}</span>
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
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
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
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    )
}
