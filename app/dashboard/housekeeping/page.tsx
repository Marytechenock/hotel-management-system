'use client'

import { useState, useMemo } from 'react'
import {
  Sparkles,
  BedDouble,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  MoreHorizontal,
  Play,
  Pause,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { rooms, getRoomsByProperty } from '@/lib/mock-data'
import { useAppStore } from '@/lib/store'

type CleaningStatus = 'pending' | 'in_progress' | 'completed' | 'inspected'

interface HousekeepingTask {
  roomId: string
  roomNumber: string
  floor: number
  status: CleaningStatus
  priority: 'high' | 'normal' | 'low'
  assignedTo?: string
  startedAt?: Date
  completedAt?: Date
  notes?: string
}

// Generate mock housekeeping tasks from rooms
const generateTasks = (propertyRooms: typeof rooms): HousekeepingTask[] => {
  const statuses: CleaningStatus[] = ['pending', 'in_progress', 'completed', 'inspected']
  const priorities: ('high' | 'normal' | 'low')[] = ['high', 'normal', 'low']
  const assignees = ['Maria Garcia', 'Carlos Rodriguez', 'Anna Kim', 'James Wilson']
  
  return propertyRooms
    .filter(r => r.status === 'cleaning' || r.status === 'available')
    .map(room => ({
      roomId: room.id,
      roomNumber: room.number,
      floor: room.floor,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      assignedTo: assignees[Math.floor(Math.random() * assignees.length)],
      startedAt: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 3600000) : undefined,
    }))
}

const statusColors: Record<CleaningStatus, string> = {
  pending: 'bg-warning/20 text-warning-foreground border-warning/30',
  in_progress: 'bg-primary/10 text-primary border-primary/30',
  completed: 'bg-success/10 text-success border-success/30',
  inspected: 'bg-accent/20 text-accent-foreground border-accent/30',
}

const priorityColors: Record<string, string> = {
  high: 'bg-destructive/10 text-destructive border-destructive/30',
  normal: 'bg-primary/10 text-primary border-primary/30',
  low: 'bg-muted text-muted-foreground border-border',
}

export default function HousekeepingPage() {
  const { currentProperty } = useAppStore()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  const propertyRooms = useMemo(() => 
    currentProperty ? getRoomsByProperty(currentProperty.id) : rooms,
    [currentProperty]
  )

  const tasks = useMemo(() => generateTasks(propertyRooms), [propertyRooms])

  const filteredTasks = useMemo(() => {
    let result = tasks
    if (statusFilter !== 'all') {
      result = result.filter(t => t.status === statusFilter)
    }
    if (priorityFilter !== 'all') {
      result = result.filter(t => t.priority === priorityFilter)
    }
    return result
  }, [tasks, statusFilter, priorityFilter])

  const stats = useMemo(() => ({
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed' || t.status === 'inspected').length,
    highPriority: tasks.filter(t => t.priority === 'high').length,
  }), [tasks])

  const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0

  const tasksByFloor = useMemo(() => {
    const floors = new Map<number, HousekeepingTask[]>()
    filteredTasks.forEach(task => {
      const existing = floors.get(task.floor) || []
      floors.set(task.floor, [...existing, task])
    })
    return Array.from(floors.entries()).sort((a, b) => a[0] - b[0])
  }, [filteredTasks])

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Housekeeping</h1>
        <p className="text-muted-foreground">
          Room cleaning status for {currentProperty?.name || 'all properties'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <BedDouble className="size-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className={statusFilter === 'pending' ? 'ring-2 ring-warning' : ''}>
          <CardContent className="pt-4 cursor-pointer" onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-warning-foreground">{stats.pending}</p>
              </div>
              <Clock className="size-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card className={statusFilter === 'in_progress' ? 'ring-2 ring-primary' : ''}>
          <CardContent className="pt-4 cursor-pointer" onClick={() => setStatusFilter(statusFilter === 'in_progress' ? 'all' : 'in_progress')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-primary">{stats.inProgress}</p>
              </div>
              <Sparkles className="size-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-success">{stats.completed}</p>
              </div>
              <CheckCircle className="size-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card className={priorityFilter === 'high' ? 'ring-2 ring-destructive' : ''}>
          <CardContent className="pt-4 cursor-pointer" onClick={() => setPriorityFilter(priorityFilter === 'high' ? 'all' : 'high')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High Priority</p>
                <p className="text-2xl font-bold text-destructive">{stats.highPriority}</p>
              </div>
              <AlertCircle className="size-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Daily Progress</span>
            <span className="text-sm text-muted-foreground">{completionRate.toFixed(0)}% Complete</span>
          </div>
          <Progress value={completionRate} className="h-3" />
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="inspected">Inspected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tasks by Floor */}
      <div className="space-y-6">
        {tasksByFloor.map(([floor, floorTasks]) => (
          <div key={floor}>
            <h3 className="text-lg font-semibold mb-3">Floor {floor}</h3>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {floorTasks.map((task) => (
                <Card key={task.roomId} className="overflow-hidden">
                  <div className={`h-1 ${
                    task.priority === 'high' ? 'bg-destructive' :
                    task.priority === 'normal' ? 'bg-primary' :
                    'bg-muted'
                  }`} />
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-lg font-bold">Room {task.roomNumber}</h4>
                        <Badge variant="outline" className={`text-xs ${priorityColors[task.priority]}`}>
                          {task.priority} priority
                        </Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-7">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {task.status === 'pending' && (
                            <DropdownMenuItem>
                              <Play className="mr-2 size-4" />
                              Start Cleaning
                            </DropdownMenuItem>
                          )}
                          {task.status === 'in_progress' && (
                            <>
                              <DropdownMenuItem>
                                <Pause className="mr-2 size-4" />
                                Pause
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Check className="mr-2 size-4" />
                                Mark Complete
                              </DropdownMenuItem>
                            </>
                          )}
                          {task.status === 'completed' && (
                            <DropdownMenuItem>
                              <CheckCircle className="mr-2 size-4" />
                              Mark Inspected
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <Badge variant="outline" className={statusColors[task.status]}>
                      {task.status === 'pending' && <Clock className="mr-1 size-3" />}
                      {task.status === 'in_progress' && <Sparkles className="mr-1 size-3" />}
                      {(task.status === 'completed' || task.status === 'inspected') && <CheckCircle className="mr-1 size-3" />}
                      <span className="capitalize">{task.status.replace('_', ' ')}</span>
                    </Badge>

                    {task.assignedTo && (
                      <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                        <User className="size-3" />
                        {task.assignedTo}
                      </div>
                    )}

                    {task.startedAt && (
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        Started {new Date(task.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <Card className="p-12 text-center">
          <Sparkles className="mx-auto size-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No tasks found</h3>
          <p className="text-muted-foreground">All rooms are clean or no tasks match your filters</p>
        </Card>
      )}
    </div>
  )
}
