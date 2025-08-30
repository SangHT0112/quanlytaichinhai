"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse  } from "@react-oauth/google"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import axiosInstance from "@/config/axios"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AlignRight } from "lucide-react"
import { login } from "@/api/auth/loginApi"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage("Nhập đầy đủ email và mật khẩu")
      return
    }
    setLoading(true)

    try {
      const data = await login(email, password)
      console.log("DU LIEU USER", data.user)
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))

      const redirectPath = localStorage.getItem("redirectAfterLogin") || "/"
      localStorage.removeItem("redirectAfterLogin")
      router.push(redirectPath)
      window.location.href = redirectPath
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message)
      } else {
        setErrorMessage("Đăng nhập thất bại")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      const response = await axiosInstance.post("/auth/google", {
        credential: credentialResponse.credential,
      })
      const data = response.data
      if (response.status === 200) {
        localStorage.setItem("token", data.token)
        localStorage.setItem("user", JSON.stringify(data.user))
        const redirectPath = localStorage.getItem("redirectAfterLogin") || "/"
        localStorage.removeItem("redirectAfterLogin")
        router.push(redirectPath)
        window.location.href = redirectPath
      } else {
        setErrorMessage(data.message || "Đăng nhập bằng Google thất bại")
      }
    } catch{
      setErrorMessage("Lỗi kết nối với server")
    }
  }

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative z-50">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=&quot;60&quot; height=&quot;60&quot; viewBox=&quot;0 0 60 60&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cg fill=&quot;none&quot; fill-rule=&quot;evenodd&quot;%3E%3Cg fill=&quot;%239C92AC&quot; fill-opacity=&quot;0.05&quot;%3E%3Ccircle cx=&quot;30&quot; cy=&quot;30&quot; r=&quot;2&quot;/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />

        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>

        <Card className="w-full max-w-md bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl relative z-10">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Đăng nhập
            </CardTitle>
            <CardDescription className="text-gray-300">
              Nhập thông tin để truy cập tài khoản của bạn
            </CardDescription>
          </CardHeader>

          {errorMessage && (
            <div className="bg-red-500/20 text-red-500 p-4 rounded-md mb-4">
              <AlignRight className="inline mr-2" />
              {errorMessage}
            </div>
          )}

          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-200 font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400 focus:ring-purple-400/20 h-12"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-200 font-medium">
                  Mật khẩu
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400 focus:ring-purple-400/20 h-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2 text-gray-300">
                <input type="checkbox" className="rounded border-white/20 bg-white/10" />
                <span>Ghi nhớ đăng nhập</span>
              </label>
              <a href="/forgot-password" className="text-purple-300 hover:text-purple-200 underline">
                Quên mật khẩu?
              </a>
            </div>

            <Button
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white/10 text-gray-300">Hoặc tiếp tục với</span>
              </div>
            </div>

            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setErrorMessage("Đăng nhập bằng Google thất bại")}
              text="signin_with"
              width="384"
            />

            <p className="text-center text-sm text-gray-300">
              Chưa có tài khoản?{" "}
              <a href="/register" className="text-purple-300 hover:text-purple-200 underline font-medium">
                Đăng ký ngay
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </GoogleOAuthProvider>
  )
}