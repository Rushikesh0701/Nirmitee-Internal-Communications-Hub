import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'

const SurveyForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id
  const [questions, setQuestions] = useState([])

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    defaultValues: {
      title: '',
      description: '',
      status: 'ACTIVE'
    }
  })

  // Load existing survey if editing
  const { data: survey, isLoading } = useQuery(
    ['survey', id],
    () => api.get(`/surveys/${id}`).then((res) => res.data.data),
    { enabled: isEdit }
  )

  useEffect(() => {
    if (survey) {
      setValue('title', survey.title)
      setValue('description', survey.description || '')
      setValue('status', survey.status || 'ACTIVE')
      if (survey.questions) {
        setQuestions(survey.questions.map(q => ({
          type: q.type,
          questionText: q.questionText,
          options: q.options || []
        })))
      }
    }
  }, [survey, setValue])

  const addQuestion = () => {
    setQuestions([...questions, { type: 'TEXT', questionText: '', options: [] }])
  }

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const updateQuestion = (index, field, value) => {
    const updated = [...questions]
    updated[index] = { ...updated[index], [field]: value }
    setQuestions(updated)
  }

  const addOption = (questionIndex) => {
    const updated = [...questions]
    if (!updated[questionIndex].options) {
      updated[questionIndex].options = []
    }
    updated[questionIndex].options.push('')
    setQuestions(updated)
  }

  const removeOption = (questionIndex, optionIndex) => {
    const updated = [...questions]
    updated[questionIndex].options = updated[questionIndex].options.filter((_, i) => i !== optionIndex)
    setQuestions(updated)
  }

  const updateOption = (questionIndex, optionIndex, value) => {
    const updated = [...questions]
    updated[questionIndex].options[optionIndex] = value
    setQuestions(updated)
  }

  const createMutation = useMutation(
    (data) => api.post('/surveys/create', data),
    {
      onSuccess: () => {
        toast.success('Survey created successfully')
        queryClient.invalidateQueries('surveys')
        navigate('/surveys')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create survey')
      }
    }
  )

  const updateMutation = useMutation(
    (data) => api.put(`/surveys/${id}/edit`, data),
    {
      onSuccess: () => {
        toast.success('Survey updated successfully')
        queryClient.invalidateQueries('surveys')
        queryClient.invalidateQueries(['survey', id])
        navigate('/surveys')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update survey')
      }
    }
  )

  const onSubmit = (data) => {
    if (questions.length === 0) {
      toast.error('Please add at least one question')
      return
    }

    const payload = {
      title: data.title,
      description: data.description || undefined,
      status: data.status,
      questions: questions.map((q, index) => ({
        type: q.type,
        questionText: q.questionText,
        options: q.type !== 'TEXT' ? q.options.filter(opt => opt.trim()) : null,
        order: index
      }))
    }

    if (isEdit) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate(payload)
    }
  }

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        to="/surveys"
        className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
      >
        <ArrowLeft size={18} />
        Back to Surveys
      </Link>

      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {isEdit ? 'Edit Survey' : 'Create New Survey'}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('title', { required: 'Title is required' })}
              className="input"
              placeholder="Enter survey title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="input"
              placeholder="Describe the survey purpose"
            />
          </div>

          {isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select {...register('status')} className="input">
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          )}

          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Questions</h2>
              <button
                type="button"
                onClick={addQuestion}
                className="btn btn-primary flex items-center gap-2"
              >
                <Plus size={18} />
                Add Question
              </button>
            </div>

            {questions.length === 0 && (
              <p className="text-gray-500 text-center py-8">
                No questions added yet. Click "Add Question" to get started.
              </p>
            )}

            {questions.map((question, qIndex) => (
              <div key={qIndex} className="border rounded-lg p-4 mb-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Question {qIndex + 1}
                      </label>
                      <input
                        type="text"
                        value={question.questionText}
                        onChange={(e) => updateQuestion(qIndex, 'questionText', e.target.value)}
                        className="input"
                        placeholder="Enter question text"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type
                      </label>
                      <select
                        value={question.type}
                        onChange={(e) => updateQuestion(qIndex, 'type', e.target.value)}
                        className="input"
                      >
                        <option value="TEXT">Text</option>
                        <option value="MCQ">Multiple Choice (MCQ)</option>
                        <option value="RATING">Rating (1-5)</option>
                      </select>
                    </div>

                    {question.type !== 'TEXT' && question.type !== 'RATING' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Options
                        </label>
                        {question.options?.map((option, oIndex) => (
                          <div key={oIndex} className="flex items-center gap-2 mb-2">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                              className="input flex-1"
                              placeholder={`Option ${oIndex + 1}`}
                            />
                            <button
                              type="button"
                              onClick={() => removeOption(qIndex, oIndex)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addOption(qIndex)}
                          className="text-sm text-primary-600 hover:text-primary-700"
                        >
                          + Add Option
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeQuestion(qIndex)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded ml-4"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 pt-4 border-t">
            <button
              type="submit"
              disabled={createMutation.isLoading || updateMutation.isLoading}
              className="btn btn-primary flex items-center gap-2"
            >
              <Save size={18} />
              {createMutation.isLoading || updateMutation.isLoading
                ? 'Saving...'
                : isEdit
                ? 'Update Survey'
                : 'Create Survey'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/surveys')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SurveyForm

