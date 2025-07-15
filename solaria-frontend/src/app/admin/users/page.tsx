"use client"

import { useState } from "react"
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

const userSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    userId: z.string().min(3, "User ID must be at least 3 characters"),
    userType: z.string().min(1, "Please select a user type"),
})

type UserFormValues = z.infer<typeof userSchema>

interface User {
    id: string
    name: string
    email: string
    userId: string
    userType: string
    createdAt: string
}

export default function UsersPage() {
    const [open, setOpen] = useState(false)
    const [users, setUsers] = useState<User[]>([
        {
            id: "1",
            name: "John Doe",
            email: "john@example.com",
            userId: "JD001",
            userType: "Admin",
            createdAt: "2024-01-15",
        },
        {
            id: "2",
            name: "Jane Smith",
            email: "jane@example.com",
            userId: "JS002",
            userType: "User",
            createdAt: "2024-01-16",
        },
        {
            id: "3",
            name: "Mike Johnson",
            email: "mike@example.com",
            userId: "MJ003",
            userType: "Moderator",
            createdAt: "2024-01-17",
        },
        {
            id: "4",
            name: "Mike Johnson",
            email: "mike@example.com",
            userId: "MJ003",
            userType: "Moderator",
            createdAt: "2024-01-17",
        },
        {
            id: "5",
            name: "Mike Johnson",
            email: "mike@example.com",
            userId: "MJ003",
            userType: "Moderator",
            createdAt: "2024-01-17",
        },
        {
            id: "6",
            name: "Mike Johnson",
            email: "mike@example.com",
            userId: "MJ003",
            userType: "Moderator",
            createdAt: "2024-01-17",
        },
        {
            id: "7",
            name: "Mike Johnson",
            email: "mike@example.com",
            userId: "MJ003",
            userType: "Moderator",
            createdAt: "2024-01-17",
        },
    ])

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
            name: "",
            email: "",
            userId: "",
            userType: "",
        },
    })

    const onSubmit = async (data: UserFormValues) => {
        const newUser: User = {
            id: Date.now().toString(),
            ...data,
            createdAt: new Date().toISOString().split("T")[0],
        }

        setUsers([...users, newUser])
        form.reset()
        setOpen(false)
    }

    // const handlePrintTable = () => {
    //     const printContent = document.getElementById("users-table")
    //     const originalContent = document.body.innerHTML

    //     if (printContent) {
    //         document.body.innerHTML = printContent.outerHTML
    //         window.print()
    //         document.body.innerHTML = originalContent
    //         window.location.reload()
    //     }
    // }

    const handlePrintUser = (user: User) => {
        const printWindow = window.open("", "_blank")
        if (printWindow) {
            printWindow.document.write(`
        <html>
          <head>
            <title>User Details - ${user.name}</title>
            <style>
              body { font-family: sans-serif; padding: 20px; }
              h1 { color: #333; }
              p { margin-bottom: 10px; }
              strong { display: inline-block; width: 100px; }
            </style>
          </head>
          <body>
            <h1>User Details</h1>
            <p><strong>Name:</strong> ${user.name}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>User ID:</strong> ${user.userId}</p>
            <p><strong>User Type:</strong> ${user.userType}</p>
            <p><strong>Created At:</strong> ${user.createdAt}</p>
          </body>
        </html>
      `)
            printWindow.document.close()
            printWindow.print()
        }
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex flex-col space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                        <p className="text-gray-600 mt-1">Manage and view all users in the system</p>
                    </div>
                    <div className="flex gap-3">
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button className="flex items-center gap-2">
                                    <Plus className="h-4 w-4" />
                                    Add User
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>Add New User</DialogTitle>
                                    <DialogDescription>Fill in the details below to create a new user account.</DialogDescription>
                                </DialogHeader>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Name</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Input placeholder="Enter user name or search..." {...field} className="pr-10" />
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
                                                    <FormLabel>Email</FormLabel>
                                                    <FormControl>
                                                        <Input type="email" placeholder="Enter email address" {...field} />
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
                                                    <FormLabel>User ID</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Enter unique user ID" {...field} />
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
                                                    <FormLabel>User Type</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select user type" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="Admin">Admin</SelectItem>
                                                            <SelectItem value="User">User</SelectItem>
                                                            <SelectItem value="Moderator">Moderator</SelectItem>
                                                            <SelectItem value="Guest">Guest</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="flex justify-end space-x-3 pt-4">
                                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                                Cancel
                                            </Button>
                                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                                {form.formState.isSubmitting ? "Adding..." : "Add User"}
                                            </Button>
                                        </div>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Users Table */}
                <Card>

                    <CardContent>
                        <div id="users-table">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[100px]">ID</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>User ID</TableHead>
                                        <TableHead>User Type</TableHead>
                                        <TableHead>Created Date</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                                No users found. Add a new user to get started.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        currentUsers.map((user, index) => (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-medium">{indexOfFirstItem + index + 1}</TableCell>
                                                <TableCell>{user.name}</TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell>{user.userId}</TableCell>
                                                <TableCell>
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.userType === "Admin"
                                                            ? "bg-red-100 text-red-800"
                                                            : user.userType === "Moderator"
                                                                ? "bg-yellow-100 text-yellow-800"
                                                                : "bg-green-100 text-green-800"
                                                            }`}
                                                    >
                                                        {user.userType}
                                                    </span>
                                                </TableCell>
                                                <TableCell>{user.createdAt}</TableCell>
                                                <TableCell className="text-right">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handlePrintUser(user)}
                                                                    className="h-8 w-8"
                                                                >
                                                                    <Printer className="h-4 w-4" />
                                                                    <span className="sr-only">Print {user.name}</span>
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Print User Details</p>
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
        </div >
    )
}
