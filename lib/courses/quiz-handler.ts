import { dbService } from '@/lib/database'

interface ShuffleResult<T> {
  items: T[]
  mapping: number[]
}

const shuffleWithMapping = <T>(items: T[]): ShuffleResult<T> => {
  const indices = items.map((_, idx) => idx)
  const shuffledIndices = [...indices]
  
  for (let i = shuffledIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffledIndices[i], shuffledIndices[j]] = [shuffledIndices[j], shuffledIndices[i]]
  }
  
  return {
    items: shuffledIndices.map(idx => items[idx]),
    mapping: shuffledIndices
  }
}

export const retrieveQuizWithRandomization = async (quizId: string) => {
  const quizData = await dbService.getPrisma().quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: {
        orderBy: { order: 'asc' }
      },
      section: {
        include: {
          chapter: {
            include: {
              module: {
                include: {
                  course: true
                }
              }
            }
          }
        }
      }
    }
  })

  if (!quizData) {
    return null
  }

  let processedQuestions = quizData.questions.map(q => {
    const optionsList = JSON.parse(q.options)
    const correctList = JSON.parse(q.correctAnswers)
    
    return {
      id: q.id,
      question: q.question,
      questionType: q.questionType,
      options: optionsList,
      correctAnswers: correctList,
      explanation: q.explanation,
      originalOrder: q.order
    }
  })

  const questionShuffleResult = quizData.randomizeOrder
    ? shuffleWithMapping(processedQuestions)
    : { items: processedQuestions, mapping: processedQuestions.map((_, i) => i) }

  const questionsWithShuffledOptions = questionShuffleResult.items.map((q, qIdx) => {
    if (quizData.randomizeOrder) {
      const optionShuffleResult = shuffleWithMapping(q.options)
      
      const updatedCorrectAnswers = q.correctAnswers.map((oldIdx: number) => {
        return optionShuffleResult.mapping.indexOf(oldIdx)
      })
      
      return {
        ...q,
        options: optionShuffleResult.items,
        correctAnswers: updatedCorrectAnswers,
        optionMapping: optionShuffleResult.mapping,
        questionPosition: qIdx
      }
    }
    
    return {
      ...q,
      optionMapping: q.options.map((_: any, i: number) => i),
      questionPosition: qIdx
    }
  })

  return {
    id: quizData.id,
    title: quizData.title,
    description: quizData.description,
    passingScore: quizData.passingScore,
    timeLimit: quizData.timeLimit,
    showAnswers: quizData.showAnswers,
    randomizeOrder: quizData.randomizeOrder,
    questions: questionsWithShuffledOptions,
    questionMapping: questionShuffleResult.mapping,
    courseId: quizData.section.chapter.module.course.id,
    chapterId: quizData.section.chapter.id
  }
}

export const processQuizSubmission = async (
  quizId: string,
  userId: string,
  submittedAnswers: Record<string, number[]>,
  timeTakenSeconds?: number
) => {
  const quizData = await dbService.getPrisma().quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: true
    }
  })

  if (!quizData) {
    throw new Error('Quiz not found')
  }

  let correctAnswersCount = 0
  const questionResults: any[] = []

  for (const question of quizData.questions) {
    const correctAnswersList = JSON.parse(question.correctAnswers)
    const userAnswers = submittedAnswers[question.id] || []
    
    const sortedCorrect = [...correctAnswersList].sort((a, b) => a - b)
    const sortedUser = [...userAnswers].sort((a, b) => a - b)
    
    const isCorrect = JSON.stringify(sortedCorrect) === JSON.stringify(sortedUser)
    
    if (isCorrect) {
      correctAnswersCount++
    }
    
    questionResults.push({
      questionId: question.id,
      userAnswers,
      correctAnswers: correctAnswersList,
      isCorrect,
      explanation: question.explanation
    })
  }

  const totalQuestionsCount = quizData.questions.length
  const scorePercentage = totalQuestionsCount > 0
    ? (correctAnswersCount / totalQuestionsCount) * 100
    : 0

  const attemptRecord = await dbService.getPrisma().quizAttempt.create({
    data: {
      quizId,
      userId,
      answers: JSON.stringify(submittedAnswers),
      score: scorePercentage,
      totalQuestions: totalQuestionsCount,
      correctAnswers: correctAnswersCount,
      timeTaken: timeTakenSeconds,
      completedAt: new Date()
    }
  })

  const isPassed = quizData.passingScore ? scorePercentage >= quizData.passingScore : true

  return {
    attemptId: attemptRecord.id,
    score: scorePercentage,
    totalQuestions: totalQuestionsCount,
    correctAnswers: correctAnswersCount,
    isPassed,
    passingScore: quizData.passingScore,
    timeTaken: timeTakenSeconds,
    showAnswers: quizData.showAnswers,
    results: quizData.showAnswers ? questionResults : undefined
  }
}

export const fetchStudentQuizHistory = async (userId: string, quizId: string) => {
  const attemptsList = await dbService.getPrisma().quizAttempt.findMany({
    where: {
      quizId,
      userId
    },
    orderBy: {
      completedAt: 'desc'
    },
    take: 10
  })

  const bestScore = attemptsList.length > 0
    ? Math.max(...attemptsList.map(a => a.score))
    : 0

  const averageScore = attemptsList.length > 0
    ? attemptsList.reduce((sum, a) => sum + a.score, 0) / attemptsList.length
    : 0

  return {
    attempts: attemptsList,
    totalAttempts: attemptsList.length,
    bestScore,
    averageScore
  }
}

export const retrieveQuizAttemptDetails = async (attemptId: string) => {
  return await dbService.getPrisma().quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      quiz: {
        include: {
          questions: true
        }
      }
    }
  })
}
