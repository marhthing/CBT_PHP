import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import { Upload, Download, FileText, CheckCircle, AlertCircle, X } from 'lucide-react'

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
      const response = await api.get('/teacher/classes')
      return response.data.classes
    },
  })

  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const response = await api.get('/system/lookup?type=subjects')
      return response.data.data
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

  const styles = {
    container: {
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '0',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    header: {
      marginBottom: '2.5rem'
    },
    title: {
      fontSize: '2.25rem',
      fontWeight: '800',
      color: '#1e293b',
      marginBottom: '0.5rem',
      letterSpacing: '-0.025em'
    },
    subtitle: {
      color: '#64748b',
      fontSize: '1.125rem',
      fontWeight: '400'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '2rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(226, 232, 240, 0.8)',
      marginBottom: '2rem'
    },
    cardHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      marginBottom: '1.5rem'
    },
    cardTitle: {
      fontSize: '1.25rem',
      fontWeight: '600',
      color: '#1f2937'
    },
    description: {
      color: '#6b7280',
      fontSize: '0.875rem',
      lineHeight: '1.6',
      marginBottom: '1.5rem'
    },
    button: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.75rem 1.5rem',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '0.875rem',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      backgroundColor: 'white',
      color: '#374151'
    },
    primaryButton: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.75rem 1.5rem',
      backgroundColor: '#4f46e5',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '0.875rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: '0 4px 14px 0 rgba(79, 70, 229, 0.3)'
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem',
      marginBottom: '1.5rem'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '0.5rem'
    },
    label: {
      fontSize: '0.875rem',
      fontWeight: '500',
      color: '#374151'
    },
    select: {
      padding: '0.75rem',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '0.875rem',
      backgroundColor: 'white',
      outline: 'none'
    },
    fileInput: {
      display: 'none'
    },
    fileUploadArea: {
      border: '2px dashed #d1d5db',
      borderRadius: '12px',
      padding: '2rem',
      textAlign: 'center' as const,
      backgroundColor: '#f9fafb',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      marginBottom: '1rem'
    },
    fileUploadContent: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: '1rem'
    },
    fileIcon: {
      width: '48px',
      height: '48px',
      color: '#9ca3af'
    },
    fileText: {
      fontSize: '1rem',
      fontWeight: '500',
      color: '#374151'
    },
    fileSubtext: {
      fontSize: '0.875rem',
      color: '#6b7280'
    },
    selectedFile: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '1rem',
      backgroundColor: '#eff6ff',
      border: '1px solid #dbeafe',
      borderRadius: '8px',
      marginBottom: '1rem'
    },
    alert: {
      padding: '1rem',
      borderRadius: '8px',
      fontSize: '0.875rem',
      marginBottom: '1rem'
    },
    alertSuccess: {
      backgroundColor: '#f0fdf4',
      color: '#166534',
      border: '1px solid #bbf7d0'
    },
    alertError: {
      backgroundColor: '#fef2f2',
      color: '#dc2626',
      border: '1px solid #fecaca'
    },
    alertInfo: {
      backgroundColor: '#eff6ff',
      color: '#1d4ed8',
      border: '1px solid #dbeafe'
    },
    resultsList: {
      marginTop: '1rem'
    },
    resultItem: {
      padding: '0.75rem',
      backgroundColor: '#f9fafb',
      border: '1px solid #f3f4f6',
      borderRadius: '6px',
      marginBottom: '0.5rem',
      fontSize: '0.875rem'
    },
    removeButton: {
      padding: '0.25rem',
      backgroundColor: 'transparent',
      color: '#6b7280',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Bulk Upload Questions</h1>
        <p style={styles.subtitle}>
          Upload multiple questions at once using CSV or Excel files
        </p>
      </div>

      {/* Template Download */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <Download size={20} style={{ color: '#4f46e5' }} />
          <h2 style={styles.cardTitle}>Download Template</h2>
        </div>
        <p style={styles.description}>
          Download the CSV template to format your questions correctly before uploading. 
          The template includes sample questions to guide you.
        </p>
        <button 
          style={styles.button}
          onClick={downloadTemplate}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
        >
          <Download size={16} />
          Download CSV Template
        </button>
      </div>

      {/* Upload Form */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <Upload size={20} style={{ color: '#4f46e5' }} />
          <h2 style={styles.cardTitle}>Upload Questions</h2>
        </div>

        <div style={styles.formGrid}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Subject *</label>
            <select
              style={styles.select}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            >
              <option value="">Select subject</option>
              {subjects?.map((subj: any) => (
                <option key={subj.id} value={subj.id}>{subj.name}</option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Class Level *</label>
            <select
              style={styles.select}
              value={classLevel}
              onChange={(e) => setClassLevel(e.target.value)}
            >
              <option value="">Select class level</option>
              {['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'].map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Difficulty</label>
            <select
              style={styles.select}
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {/* File Upload */}
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          style={styles.fileInput}
          id="file-upload"
        />
        
        {!file ? (
          <label
            htmlFor="file-upload"
            style={styles.fileUploadArea}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = '#4f46e5'
              e.currentTarget.style.backgroundColor = '#fafbff'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = '#d1d5db'
              e.currentTarget.style.backgroundColor = '#f9fafb'
            }}
          >
            <div style={styles.fileUploadContent}>
              <Upload style={styles.fileIcon} />
              <div>
                <p style={styles.fileText}>Click to select your file</p>
                <p style={styles.fileSubtext}>CSV, XLS, or XLSX files supported</p>
              </div>
            </div>
          </label>
        ) : (
          <div style={styles.selectedFile}>
            <FileText size={20} style={{ color: '#4f46e5' }} />
            <span style={{ flex: 1 }}>{file.name}</span>
            <button
              style={styles.removeButton}
              onClick={() => setFile(null)}
            >
              <X size={16} />
            </button>
          </div>
        )}

        <button
          style={{
            ...styles.primaryButton,
            opacity: (!file || !subject || !classLevel || uploadMutation.isPending) ? 0.6 : 1,
            cursor: (!file || !subject || !classLevel || uploadMutation.isPending) ? 'not-allowed' : 'pointer'
          }}
          onClick={handleUpload}
          disabled={!file || !subject || !classLevel || uploadMutation.isPending}
          onMouseOver={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = '#4338ca'
            }
          }}
          onMouseOut={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = '#4f46e5'
            }
          }}
        >
          <Upload size={16} />
          {uploadMutation.isPending ? 'Uploading...' : 'Upload Questions'}
        </button>
      </div>

      {/* Upload Results */}
      {uploadResults && (
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            {uploadResults.success ? (
              <CheckCircle size={20} style={{ color: '#10b981' }} />
            ) : (
              <AlertCircle size={20} style={{ color: '#ef4444' }} />
            )}
            <h2 style={styles.cardTitle}>Upload Results</h2>
          </div>

          {uploadResults.success ? (
            <div style={styles.alertSuccess}>
              <strong>Success!</strong> {uploadResults.imported_count} questions imported successfully.
            </div>
          ) : (
            <div style={styles.alertError}>
              <strong>Upload failed:</strong> {uploadResults.message}
            </div>
          )}

          {uploadResults.errors && uploadResults.errors.length > 0 && (
            <div>
              <h4 style={{ color: '#dc2626', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>
                Errors found:
              </h4>
              <div style={styles.resultsList}>
                {uploadResults.errors.map((error: string, index: number) => (
                  <div key={index} style={styles.resultItem}>
                    {error}
                  </div>
                ))}
              </div>
            </div>
          )}

          {uploadResults.skipped && uploadResults.skipped.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <h4 style={{ color: '#f59e0b', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '600' }}>
                Skipped rows:
              </h4>
              <div style={styles.resultsList}>
                {uploadResults.skipped.map((skip: string, index: number) => (
                  <div key={index} style={styles.resultItem}>
                    {skip}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div style={styles.card}>
        <h3 style={{ ...styles.cardTitle, marginBottom: '1rem' }}>File Format Instructions</h3>
        <div style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: '1.6' }}>
          <p><strong>Required columns:</strong></p>
          <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
            <li>question_text - The main question</li>
            <li>option_a, option_b, option_c, option_d - Multiple choice options</li>
            <li>correct_answer - Must be A, B, C, or D</li>
          </ul>
          <p><strong>Tips:</strong></p>
          <ul style={{ marginLeft: '1.5rem' }}>
            <li>Use the downloaded template as a starting point</li>
            <li>Ensure all required fields are filled</li>
            <li>Keep questions clear and concise</li>
            <li>Double-check your correct answers</li>
          </ul>
        </div>
      </div>
    </div>
  )
}