import { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import { formatDate } from '../../lib/utils'
import { Plus, Edit, Trash2, Power, PowerOff, Copy, CheckCircle } from 'lucide-react'

interface TestCodeForm {
  title: string
  subject: string
  class_level: string
  duration_minutes: number
  question_count: number
  expires_at: string
}

export default function TestCodeManager() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingTest, setEditingTest] = useState<any>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<TestCodeForm>({
    title: '',
    subject: '',
    class_level: '',
    duration_minutes: 60,
    question_count: 20,
    expires_at: ''
  })

  const queryClient = useQueryClient()

  const { data: testCodes, isLoading } = useQuery({
    queryKey: ['admin-test-codes'],
    queryFn: async () => {
      const response = await api.get('/api/admin/test-codes.php')
      return response.data.test_codes
    },
  })

  const { data: subjects } = useQuery({
    queryKey: ['available-subjects'],
    queryFn: async () => {
      const response = await api.get('/api/admin/questions.php?subjects=true')
      return response.data.subjects
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: TestCodeForm) => {
      const response = await api.post('/api/admin/test-codes.php', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-test-codes'] })
      setIsCreateOpen(false)
      resetForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<TestCodeForm> }) => {
      const response = await api.put(`/api/admin/test-codes.php?id=${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-test-codes'] })
      setEditingTest(null)
      resetForm()
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      const response = await api.patch(`/api/admin/test-codes.php?id=${id}`, { is_active })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-test-codes'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/api/admin/test-codes.php?id=${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-test-codes'] })
    },
  })

  const resetForm = () => {
    setFormData({
      title: '',
      subject: '',
      class_level: '',
      duration_minutes: 60,
      question_count: 20,
      expires_at: ''
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingTest) {
      updateMutation.mutate({ id: editingTest.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleEdit = (testCode: any) => {
    setFormData({
      title: testCode.title,
      subject: testCode.subject,
      class_level: testCode.class_level,
      duration_minutes: testCode.duration_minutes,
      question_count: testCode.question_count,
      expires_at: testCode.expires_at.split(' ')[0] // Convert datetime to date
    })
    setEditingTest(testCode)
  }

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const getMinDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Test Code Manager</h1>
          <p className="text-muted-foreground">
            Create and manage test codes for students to access tests
          </p>
        </div>
        <Dialog open={isCreateOpen || !!editingTest} onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false)
            setEditingTest(null)
            resetForm()
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Test Code
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingTest ? 'Edit Test Code' : 'Create New Test Code'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Test Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Mathematics Mid-term Exam"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Subject</label>
                  <Select value={formData.subject} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, subject: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects?.map((subject: string) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Class Level</label>
                  <Select value={formData.class_level} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, class_level: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {['SS1', 'SS2', 'SS3', 'JSS1', 'JSS2', 'JSS3'].map((cls) => (
                        <SelectItem key={cls} value={cls}>
                          {cls}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Duration (minutes)</label>
                  <Input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) }))}
                    min="5"
                    max="180"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Question Count</label>
                  <Input
                    type="number"
                    value={formData.question_count}
                    onChange={(e) => setFormData(prev => ({ ...prev, question_count: parseInt(e.target.value) }))}
                    min="1"
                    max="100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Expires On</label>
                <Input
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                  min={getMinDate()}
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  setIsCreateOpen(false)
                  setEditingTest(null)
                  resetForm()
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editingTest ? 'Update' : 'Create'
                  }
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Test Codes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Test Codes ({testCodes?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : testCodes && testCodes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test Details</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Subject/Class</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testCodes.map((testCode: any) => (
                  <TableRow key={testCode.id}>
                    <TableCell>
                      <div className="font-medium">{testCode.title}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                          {testCode.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(testCode.code)}
                        >
                          {copiedCode === testCode.code ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{testCode.subject}</div>
                        <div className="text-muted-foreground">{testCode.class_level}</div>
                      </div>
                    </TableCell>
                    <TableCell>{testCode.duration_minutes}m</TableCell>
                    <TableCell>{testCode.question_count}</TableCell>
                    <TableCell>
                      <Badge variant={testCode.is_active ? 'default' : 'secondary'}>
                        {testCode.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(testCode.expires_at)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActiveMutation.mutate({
                            id: testCode.id,
                            is_active: !testCode.is_active
                          })}
                          title={testCode.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {testCode.is_active ? (
                            <PowerOff className="h-4 w-4" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(testCode)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(testCode.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No test codes created yet. Create your first test code to get started!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
