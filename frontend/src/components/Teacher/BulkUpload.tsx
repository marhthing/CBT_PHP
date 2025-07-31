import { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Alert, AlertDescription } from '../ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import { Upload, Download, FileText, CheckCircle, AlertCircle } from 'lucide-react'

export default function BulkUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [subject, setSubject] = useState('')
  const [classLevel, setClassLevel] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [uploadResults, setUploadResults] = useState<any>(null)

  const queryClient = useQueryClient()

  const { data: classes } = useQuery({
    queryKey: ['teacher-classes'],
    queryFn: async () => {
      const response = await api.get('/api/teacher/classes.php')
      return response.data.classes
    },
  })

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.post('/api/teacher/bulk-upload.php', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    },
    onSuccess: (data) => {
      setUploadResults(data)
      queryClient.invalidateQueries({ queryKey: ['teacher-questions'] })
      setFile(null)
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const allowedTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ]
      
      if (allowedTypes.includes(selectedFile.type)) {
        setFile(selectedFile)
        setUploadResults(null)
      } else {
        alert('Please select a CSV or Excel file')
      }
    }
  }

  const handleUpload = () => {
    if (!file || !subject || !classLevel) {
      alert('Please fill in all required fields and select a file')
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('subject', subject)
    formData.append('class_level', classLevel)
    formData.append('difficulty', difficulty)

    uploadMutation.mutate(formData)
  }

  const downloadTemplate = () => {
    const csvContent = [
      'question_text,option_a,option_b,option_c,option_d,correct_answer',
      'What is 2 + 2?,2,3,4,5,C',
      'What is the capital of France?,London,Paris,Berlin,Madrid,B',
      'Which planet is closest to the Sun?,Venus,Earth,Mercury,Mars,C'
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'questions_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bulk Upload Questions</h1>
        <p className="text-muted-foreground">
          Upload multiple questions at once using CSV or Excel files
        </p>
      </div>

      {/* Template Download */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Download Template
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Download the CSV template to format your questions correctly before uploading.
          </p>
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Download CSV Template
          </Button>
        </CardContent>
      </Card>

      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Subject</label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.map((cls: any) => (
                    <SelectItem key={cls.subject} value={cls.subject}>
                      {cls.subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Class Level</label>
              <Select value={classLevel} onValueChange={setClassLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.map((cls: any) => (
                    <SelectItem key={cls.class_level} value={cls.class_level}>
                      {cls.class_level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Default Difficulty</label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Upload File</label>
            <div className="mt-2">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="block w-full text-sm text-muted-foreground
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-medium
                  file:bg-primary file:text-primary-foreground
                  hover:file:bg-primary/90"
              />
            </div>
            {file && (
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                {file.name} ({Math.round(file.size / 1024)} KB)
              </div>
            )}
          </div>

          <Button 
            onClick={handleUpload}
            disabled={!file || !subject || !classLevel || uploadMutation.isPending}
            className="w-full"
          >
            {uploadMutation.isPending ? 'Uploading...' : 'Upload Questions'}
          </Button>
        </CardContent>
      </Card>

      {/* Upload Results */}
      {uploadResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {uploadResults.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              Upload Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploadResults.success ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Successfully uploaded {uploadResults.created_count} questions!
                  {uploadResults.skipped_count > 0 && 
                    ` Skipped ${uploadResults.skipped_count} invalid rows.`
                  }
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Upload failed: {uploadResults.message}
                </AlertDescription>
              </Alert>
            )}

            {uploadResults.errors && uploadResults.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Errors found:</h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {uploadResults.errors.map((error: string, index: number) => (
                    <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p><strong>File Format:</strong> CSV or Excel (.xlsx, .xls)</p>
            <p><strong>Required Columns:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>question_text - The question text</li>
              <li>option_a - First option</li>
              <li>option_b - Second option</li>
              <li>option_c - Third option</li>
              <li>option_d - Fourth option</li>
              <li>correct_answer - Correct answer (A, B, C, or D)</li>
            </ul>
            <p><strong>Notes:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>First row should contain column headers</li>
              <li>All questions will use the subject, class, and difficulty selected above</li>
              <li>Invalid rows will be skipped and reported</li>
              <li>Maximum file size: 5MB</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
