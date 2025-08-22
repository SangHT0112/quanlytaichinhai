"use client"
import { useEffect, useState } from "react"
import { fetchUsers, updateUserRole } from "@/apiAdmin/userApi"
import toast from "react-hot-toast"
import { useUser } from "@/contexts/UserProvider"
import type { User } from "@/types/users"
import { Search, Users, Shield, Clock, CheckCircle, XCircle } from "lucide-react"

export default function UserListPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all")

  const currentUser = useUser()

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    try {
      const data: User[] = await fetchUsers()
      setUsers(data)
    } catch (err) {
      console.error("Lỗi khi lấy users:", err)
      toast.error("Không thể tải danh sách người dùng")
    } finally {
      setLoading(false)
    }
  }

  async function handleChangeRole(userId: number, newRole: User["role"]) {
    try {
      await updateUserRole(userId, newRole)
      toast.success("Cập nhật quyền thành công")
      setUsers((prev) => prev.map((u) => (u.user_id === userId ? { ...u, role: newRole } : u)))
    } catch (err) {
      console.error("Lỗi khi đổi quyền:", err)
      toast.error("Cập nhật quyền thất bại")
    }
  }

  function renderStatus(user: User) {
    if (user.status === "online") {
      return (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-green-600 font-medium text-sm">Đang hoạt động</span>
        </div>
      )
    }
    if (user.last_active_at) {
      const diffMins = Math.floor((Date.now() - new Date(user.last_active_at).getTime()) / 60000)
      if (diffMins <= 10) {
        return (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-500" />
            <span className="text-yellow-600 text-sm">{diffMins} phút trước</span>
          </div>
        )
      }
    }
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
        <span className="text-gray-500 text-sm">Ngoại tuyến</span>
      </div>
    )
  }

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="w-full">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-48"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Quản lý người dùng</h1>
          </div>
          {currentUser && currentUser.role === "admin" && (
            <p className="text-gray-600">
              Bạn đang đăng nhập với quyền <span className="font-semibold text-blue-600">Admin</span>
            </p>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng người dùng</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Admin</p>
                <p className="text-2xl font-bold text-gray-900">{users.filter((u) => u.role === "admin").length}</p>
              </div>
              <Shield className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đang hoạt động</p>
                <p className="text-2xl font-bold text-gray-900">{users.filter((u) => u.status === "online").length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Người dùng</p>
                <p className="text-2xl font-bold text-gray-900">{users.filter((u) => u.role === "user").length}</p>
              </div>
              <Users className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ngoại tuyến</p>
                <p className="text-2xl font-bold text-gray-900">{users.filter((u) => u.status !== "online").length}</p>
              </div>
              <XCircle className="w-8 h-8 text-gray-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Hoạt động gần đây</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    users.filter((u) => {
                      if (!u.last_active_at) return false
                      const diffMins = Math.floor((Date.now() - new Date(u.last_active_at).getTime()) / 60000)
                      return diffMins <= 60
                    }).length
                  }
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên hoặc email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as "all" | "admin" | "user")}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="admin">Admin</option>
              <option value="user">Người dùng</option>
            </select>
          </div>
        </div>

        {/* User Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filteredUsers.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg p-12 shadow-sm border border-gray-200 text-center">
              <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy người dùng</h3>
              <p className="text-gray-500">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.user_id}
                className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {getInitials(user.username)}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">{user.username}</h3>
                        {user.role === "admin" && <Shield className="w-4 h-4 text-purple-500 flex-shrink-0" />}
                      </div>
                      <p className="text-gray-600 text-sm mb-1 truncate">{user.email}</p>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-500">ID: {user.user_id}</span>
                        {renderStatus(user)}
                      </div>
                    </div>
                  </div>

                  {/* Role Selector */}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <span className="text-sm font-medium text-gray-700">Vai trò:</span>
                    <select
                      value={user.role}
                      onChange={(e) => handleChangeRole(user.user_id, e.target.value as User["role"])}
                      className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="user">Người dùng</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
