import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Upload, Download, FileText, CheckCircle, AlertCircle, X } from 'lucide-react'

interface TeacherAssignment {
  id: number
  subject_id: number
  subject_name: string
  subject_code: string
  class_level: string
  term_id: number
  term_name: string
  session_id: number
  session_name: string
  created_at: string
}

interface LookupData {
  subjects: Array<{
    id: number
    name: string
    code: string
  }>
  terms: Array<{
    id: number
    name: string
  }>
  sessions: Array<{
    id: number
    name: string
  }>
}

export default function BulkUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [subjectId, setSubjectId] = useState('')
  const [classLevel, setClassLevel] = useState('')
  const [termId, setTermId] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [uploadResults, setUploadResults] = useState<any>(null)
  const [error, setError] = useState('')

  const queryClient = useQueryClient()

  const { data: assignments } = useQuery({
    queryKey: ['teacher-classes'],
    queryFn: async () => {
      const response = await api.get('/teacher/classes')
      return response.data.data.classes as TeacherAssignment[]
    },
  })

  const { data: lookupData } = useQuery({
    queryKey: ['lookup-data'],
    queryFn: async () => {
      const response = await api.get('/system/lookup')
      return response.data.data as LookupData
    },
  })

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.post('/teacher/bulk-upload', formData, {
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
        setError('')
      } else {
        setError('Please select a CSV or Excel file')
      }
    }
  }

  const handleUpload = () => {
    if (!file || !subjectId || !classLevel || !termId || !sessionId) {
      setError('Please fill in all required fields and select a file')
      return
    }
    setError('')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('subject_id', subjectId)
    formData.append('class_level', classLevel)
    formData.append('term_id', termId)
    formData.append('session_id', sessionId)
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

  const availableAssignments = assignments?.filter(assignment => 
    !subjectId || assignment.subject_id === parseInt(subjectId)
  ) || []

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Bulk Upload Questions</h1>
          <p className="text-gray-600">Upload multiple questions from CSV files</p>
        </div>

        {/* Template Download Card */}
        <div className="bg-white rounded-lg border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Download Template</h2>
              <p className="text-gray-600">Get the CSV template with proper format</p>
            </div>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              Download CSV Template
            </button>
          </div>
        </div>

        {/* Upload Form */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Questions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Subject</option>
                {Array.from(new Set(assignments?.map(a => a.subject_id) || [])).map(sId => {
                  const subject = lookupData?.subjects.find(s => s.id === sId)
                  return subject ? (
                    <option key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </option>
                  ) : null
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class *
              </label>
              <select
                value={classLevel}
                onChange={(e) => setClassLevel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Class</option>
                {Array.from(new Set(availableAssignments.map(a => a.class_level))).map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Term *
              </label>
              <select
                value={termId}
                onChange={(e) => setTermId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Term</option>
                {Array.from(new Set(availableAssignments.map(a => a.term_id))).map(tId => {
                  const term = lookupData?.terms.find(t => t.id === tId)
                  return term ? (
                    <option key={term.id} value={term.id}>{term.name}</option>
                  ) : null
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session *
              </label>
              <select
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Session</option>
                {Array.from(new Set(availableAssignments.map(a => a.session_id))).map(sId => {
                  const session = lookupData?.sessions.find(s => s.id === sId)
                  return session ? (
                    <option key={session.id} value={session.id}>{session.name}</option>
                  ) : null
                })}
              </select>
            </div>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Questions File *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                onChange={handleFileChange}
                accept=".csv,.xlsx,.xls"
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-2">
                  <span className="text-blue-600 hover:text-blue-500">Choose a file</span>
                  <span className="text-gray-500"> or drag and drop</span>
                </div>
                <p className="text-xs text-gray-500">CSV or Excel files only</p>
              </label>
              {file && (
                <div className="mt-2 flex items-center justify-center gap-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-900">{file.name}</span>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={uploadMutation.isPending || !file || !subjectId || !classLevel || !termId || !sessionId}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploadMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload Questions
              </>
            )}
          </button>
        </div>

        {/* Upload Results */}
        {uploadResults && (
          <div className="mt-6 bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-lg font-semibold text-gray-900">{uploadResults.data?.created_count || 0}</p>
                  <p className="text-sm text-gray-600">Questions Created</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="text-lg font-semibold text-gray-900">{uploadResults.data?.skipped_count || 0}</p>
                  <p className="text-sm text-gray-600">Questions Skipped</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-lg font-semibold text-gray-900">{uploadResults.data?.total_rows || 0}</p>
                  <p className="text-sm text-gray-600">Total Rows</p>
                </div>
              </div>
            </div>

            {uploadResults.data?.errors && uploadResults.data.errors.length > 0 && (
              <div className="bg-red-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-red-800 mb-2">Errors:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {uploadResults.data.errors.map((error: string, index: number) => (
                    <li key={index} className="text-sm text-red-700">{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}