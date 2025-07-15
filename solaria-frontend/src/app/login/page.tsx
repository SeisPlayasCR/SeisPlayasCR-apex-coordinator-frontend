"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
import { useEffect, useState } from "react"
import { signIn } from 'next-auth/react';
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation";
import { toast } from "sonner"

const loginSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    })
    const { data: session, status } = useSession();
    console.log(session)
    const router = useRouter();

    useEffect(() => {
        if (status === "authenticated") {
            router.replace("/admin/users");
        }
    }, [status]);

    const onSubmit = async (data: LoginFormValues) => {
        console.log("Login data:", data);

        const result = await signIn("credentials", {
            email: data.email,
            password: data.password,
            redirect: false,
        });

        console.log("signIn result:", result);

        if (result?.ok && !result?.error) {
            toast.success("Login successful");
            router.replace("/admin/users");
        } else {
            toast.error("Login failed: Invalid credentials");
            console.error("Login failed:", result?.error);
        }
    };

    return (
        <div className="h-screen grid lg:grid-cols-2 overflow-hidden">
            {/* Left side - Text and Image */}
            <div className="hidden lg:flex lg:flex-col lg:items-center lg:justify-center lg:px-12 bg-gradient-to-br from-slate-900 to-slate-800">
                <div className="max-w-md text-center">
                    <h1 className="text-4xl font-bold text-white mb-6">Welcome back to our platform</h1>
                    <p className="text-slate-300 text-lg mb-8">
                        Sign in to access your dashboard and manage your projects with ease. Join thousands of users who trust our
                        platform for their daily workflow.
                    </p>
                    <div className="space-y-4 text-slate-300">
                        <div className="flex items-center justify-center space-x-3">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                            <span>Secure and encrypted</span>
                        </div>
                        <div className="flex items-center justify-center space-x-3">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                            <span>24/7 customer support</span>
                        </div>
                        <div className="flex items-center justify-center space-x-3">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                            <span>Easy to use interface</span>
                        </div>
                    </div>
                </div>
                {/* <div className="mt-12">
                    <Image
                        src="/placeholder.svg?height=300&width=400"
                        alt="Login illustration"
                        width={400}
                        height={300}
                        className="rounded-lg opacity-80"
                    />
                </div> */}
            </div>

            {/* Right side - Login Form */}
            <div className="flex items-center justify-center p-6 lg:p-12 bg-gray-50 overflow-y-auto">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-lg shadow-xl p-8">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-gray-900">Sign In</h2>
                            <p className="text-gray-600 mt-2">Enter your credentials to access your account</p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email
                                </label>
                                <input
                                    {...register("email")}
                                    type="email"
                                    id="email"
                                    placeholder="Enter your email"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                />
                                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        {...register("password")}
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        placeholder="Enter your password"
                                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <input
                                        id="remember"
                                        type="checkbox"
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                                        Remember me
                                    </label>
                                </div>
                                <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-500">
                                    Forgot password?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                            >
                                {isSubmitting ? "Signing in..." : "Sign In"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
