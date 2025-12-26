import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import Loading from '../../components/Loading'

const SurveyForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id
  const [questions, setQuestions] = useState([])

  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
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
      onSuccess: async () => {
        toast.success('Survey created successfully')
        await queryClient.invalidateQueries('surveys')
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
      onSuccess: async () => {
        toast.success('Survey updated successfully')
        await queryClient.invalidateQueries('surveys')
        await queryClient.invalidateQueries(['survey', id])
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
    return <Loading fullScreen />
  }

  return (
    <div className="w-full space-y-6">
      <Link
        to="/surveys"
        className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors mb-4"
      >
        <ArrowLeft size={18} />
        <span className="font-medium">Back to Surveys</span>
      </Link>

      <div className="card p-6 lg:p-8 dark:bg-[#052829]">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-8">
          {isEdit ? 'Edit Survey' : 'Create New Survey'}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('title', { required: 'Title is required' })}
              className="input text-base py-2.5"
              placeholder="Enter survey title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={4}
              className="input text-base py-2.5 resize-y"
              placeholder="Describe the survey purpose"
            />
          </div>

          {isEdit && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                Status
              </label>
              <select {...register('status')} className="input text-base py-2.5">
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          )}

          <div className="border-t border-slate-200 dark:border-slate-700 pt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">Questions</h2>
              <button
                type="button"
                onClick={addQuestion}
                className="btn-add"
              >
                <Plus size={18} />
                Add Question
              </button>
            </div>

            {questions.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-[#0a3a3c]">
                <p className="text-gray-500 dark:text-slate-400 text-base">
                  No questions added yet. Click &quot;Add Question&quot; to get started.
                </p>
              </div>
            )}

            {questions.map((question, qIndex) => (
              <div key={qIndex} className="border-2 border-slate-200 dark:border-slate-700 rounded-xl p-6 mb-6 bg-white dark:bg-[#0a3a3c] hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                        Question {qIndex + 1}
                      </label>
                      <input
                        type="text"
                        value={question.questionText}
                        onChange={(e) => updateQuestion(qIndex, 'questionText', e.target.value)}
                        className="input text-base py-2.5"
                        placeholder="Enter question text"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                        Type
                      </label>
                      <select
                        value={question.type}
                        onChange={(e) => updateQuestion(qIndex, 'type', e.target.value)}
                        className="input text-base py-2.5"
                      >
                        <option value="TEXT">Text</option>
                        <option value="MCQ">Multiple Choice (MCQ)</option>
                        <option value="RATING">Rating (1-5)</option>
                      </select>
                    </div>

                    {question.type !== 'TEXT' && question.type !== 'RATING' && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">
                          Options
                        </label>
                        <div className="space-y-3">
                          {question.options?.map((option, oIndex) => (
                            <div key={oIndex} className="flex items-center gap-3">
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                className="input flex-1 text-base py-2.5"
                                placeholder={`Option ${oIndex + 1}`}
                              />
                              <button
                                type="button"
                                onClick={() => removeOption(qIndex, oIndex)}
                                className="p-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors flex-shrink-0"
                                title="Remove option"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addOption(qIndex)}
                            className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:underline transition-colors"
                          >
                            + Add Option
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeQuestion(qIndex)}
                    className="p-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors flex-shrink-0"
                    title="Remove question"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
            <button
              type="submit"
              disabled={createMutation.isLoading || updateMutation.isLoading}
              className="btn btn-primary flex items-center gap-2"
            >
              <Save size={20} />
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

