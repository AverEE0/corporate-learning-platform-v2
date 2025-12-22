"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Users, Plus, Edit, Trash2, UserPlus, X } from "lucide-react"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface Group {
  id: number
  name: string
  description?: string
  manager_id?: number
  manager_first_name?: string
  manager_last_name?: string
  manager_email?: string
  user_count?: number
}

interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  role: string
}

export function GroupsManagement() {
  const [groups, setGroups] = useState<Group[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    managerId: "none",
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [groupToDelete, setGroupToDelete] = useState<number | null>(null)

  useEffect(() => {
    loadGroups()
    loadUsers()
  }, [])

  const loadGroups = async () => {
    try {
      const response = await fetch("/api/groups")
      if (response.ok) {
        const data = await response.json()
        setGroups(data.groups || [])
      }
    } catch (error) {
      toast.error("Ошибка загрузки групп")
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error("Error loading users:", error)
    }
  }

  const handleCreate = () => {
    setEditingGroup(null)
    setFormData({ name: "", description: "", managerId: "none" })
    setIsDialogOpen(true)
  }

  const handleEdit = (group: Group) => {
    setEditingGroup(group)
    setFormData({
      name: group.name,
      description: group.description || "",
      managerId: group.manager_id?.toString() || "none",
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Введите название группы")
      return
    }

    try {
      if (editingGroup) {
        const response = await fetch(`/api/groups/${editingGroup.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            managerId: formData.managerId && formData.managerId !== "none" ? parseInt(formData.managerId) : null,
          }),
        })

        if (response.ok) {
          toast.success("Группа обновлена")
          setIsDialogOpen(false)
          loadGroups()
        } else {
          toast.error("Ошибка обновления группы")
        }
      } else {
        const response = await fetch("/api/groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            managerId: formData.managerId ? parseInt(formData.managerId) : null,
          }),
        })

        if (response.ok) {
          toast.success("Группа создана")
          setIsDialogOpen(false)
          loadGroups()
        } else {
          toast.error("Ошибка создания группы")
        }
      }
    } catch (error) {
      toast.error("Ошибка сохранения группы")
    }
  }

  const handleDeleteClick = (id: number) => {
    setGroupToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!groupToDelete) return

    try {
      const response = await fetch(`/api/groups/${groupToDelete}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Группа удалена")
        loadGroups()
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.error || "Ошибка удаления группы")
      }
    } catch (error: any) {
      toast.error("Ошибка удаления группы")
    } finally {
      setDeleteDialogOpen(false)
      setGroupToDelete(null)
    }
  }

  const managerUsers = users.filter((u) => u.role === "manager" || u.role === "admin")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Управление группами</h2>
          <p className="text-muted-foreground">Создавайте и управляйте группами пользователей</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Создать группу
        </Button>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">Загрузка...</div>
        ) : groups.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Нет созданных групп</p>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Создать первую группу
              </Button>
            </CardContent>
          </Card>
        ) : (
          groups.map((group) => (
            <Card key={group.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{group.name}</CardTitle>
                    {group.description && (
                      <CardDescription className="mt-1">{group.description}</CardDescription>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      {group.manager_first_name && (
                        <span>
                          Менеджер: {group.manager_first_name} {group.manager_last_name}
                        </span>
                      )}
                      <span>Пользователей: {group.user_count || 0}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(group)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(group.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGroup ? "Редактировать группу" : "Создать группу"}</DialogTitle>
            <DialogDescription>
              Заполните информацию о группе
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название группы *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Например: Отдел продаж"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Описание группы"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manager">Менеджер группы</Label>
              <Select
                value={formData.managerId}
                onValueChange={(value) => setFormData({ ...formData, managerId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите менеджера" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Без менеджера</SelectItem>
                  {managerUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.first_name} {user.last_name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSubmit}>
              {editingGroup ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Удаление группы"
        description="Вы уверены, что хотите удалить эту группу? Это действие нельзя отменить."
        confirmText="Удалить"
        cancelText="Отмена"
        variant="destructive"
      />
    </div>
  )
}

