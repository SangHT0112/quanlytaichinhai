"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export default function LoginRequiredModal() {
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const user = localStorage.getItem("user")
    if (!user) {
      setShowModal(true)
    }
  }, [])

  const handleLogin = () => {
    router.push("/login")
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <Dialog open={showModal}>
      <DialogContent className="bg-white text-black max-w-sm mx-auto">
        <DialogTitle>Yêu cầu đăng nhập</DialogTitle>
        <DialogDescription>
          Bạn cần đăng nhập để truy cập trang này.
        </DialogDescription>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={handleCancel}>Quay lại</Button>
          <Button onClick={handleLogin}>Đăng nhập</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
